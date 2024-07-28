import { Command } from "commander";
import path from "path";
import fs from "fs";
import crypto from "crypto"
import * as dirCompare from "dir-compare"
import clc from "cli-color"
import fsExtra from 'fs-extra';
import klaw from "klaw"

var configPath = path.join(process.cwd(), "/.gitpulse/config.json");

class Gitpulse {
  rootpath = '';
  gitpath = '';
  objPath = "";
  stagingPath = "";
  commitsPath = "";
  configPath = "";
  cwd = "";

  constructor() {
    this.rootpath = path.join(process.cwd());
    this.gitpath = path.join(this.rootpath, ".gitpulse");
    this.objPath = path.join(this.gitpath, "obj");
    this.stagingPath = path.join(this.gitpath, "staging");
    this.commitsPath = path.join(this.gitpath, "commits.txt");
    if (!fs.existsSync(path.join(this.gitpath))) {
      console.log("No git directory exists");
    }
    this.cwd = path.join(process.cwd(), "../");
    this.init();
  }

  async init() {
    const gitExists = fs.existsSync(this.gitpath);
    if (!gitExists) {
      try {
        fs.mkdir(this.gitpath, { recursive: true }, (err) => {
          console.log(err);
        });
        fs.writeFileSync(this.commitsPath, "");
        fs.mkdir(this.stagingPath, { recursive: true }, (err) => {
          console.log(err);
        });
        fs.mkdir(path.join(this.objPath,"init"), { recursive: true }, (err) => {
          console.log(err);
        });
        fs.mkdir(`${this.objPath}/init`, { recursive: true }, (err) => {
          console.log(err);
        });

      } catch (error) {
        console.log(error);
      }
    } else {
      // setInterval(() => this.deleteWasteFilesInStaging(), 15000);
      // console.log(".gitpulse aleady exists");
    }
  }

  static loadFromConfig(): Gitpulse | null {
    if (fs.existsSync(configPath)) {
      return new Gitpulse();
    }
    return null;
  }

  saveToConfig() {
    const config = {
      fileName: process.cwd(),
    };
    fs.writeFileSync(configPath, JSON.stringify(config), 'utf-8');
  }

  filesDirectory(): Promise<string[]> {
    return new Promise((resolve, reject) => {
      const directories:string[] = [];
      klaw(path.join(this.cwd))
        .on('data', (item) => { 
            if (item.path.includes("Git-pulse") || item.path.includes(".git")){
            }
            else if(item.stats.isDirectory()){
              fs.readdir(item.path,(err,files)=>{
                // console.log(item.path,files);
                if(files.length===0){
                  directories.push(item.path);
                }
              })
            }else if(item.stats.isFile()){
              directories.push(item.path);
            }
        })
        .on('error', (err) => {
          reject(err);
        })
        .on('end', () => {
          // console.log(directories);
          resolve(directories);
        });

    });
  }

  stagedDirectoryFiles(): Promise<string[]> {
    return new Promise((resolve, reject) => {
      const directories:string[] = [];
      klaw(path.join(this.stagingPath))
        .on('data', (item) => { 
          // if (item.stats.isFile()) {
          // console.log(item.path)
            if(item.stats.isDirectory()){
              fs.readdir(item.path,(err,files)=>{
                // console.log(item.path,files);
                if(files.length===0){
                  directories.push(item.path);
                }
              })
            }else if(item.stats.isFile()){
              directories.push(item.path);
            }
        })
        .on('error', (err) => {
          reject(err);
        })
        .on('end', () => {
          // console.log(directories);
          resolve(directories);
        });
 
    });
  }


  async filesDirectoryToStageEverything(): Promise<string[]> {
    return new Promise((resolve, reject) => {
      const files = fs.readdir(this.cwd, (err, files) => {
        if (err) {
          console.error('Error reading directory:', err);
          reject(err);
        }
        const filteredFiles = files.filter(file => {
          const fileName = file as string;
          return !fileName.startsWith('Git-pulse') &&
            !fileName.includes('.git') &&
            !fileName.includes('.gitpulse') &&
            !fileName.includes('node_modules') &&
            !fileName.includes('package')
          // &&
          // !fileName.startsWith('tsconfig') &&
          // !fileName.startsWith('src') &&
          // !fileName.startsWith('dist');
        })
        resolve(filteredFiles);
      });
    });
  }

  async checkUpdates() {
    //! very inefficient
    let filesDirectory = await this.filesDirectory();
    filesDirectory = filesDirectory.map((file)=>{
      return file.substring(this.cwd.length);
    })
    var stagedDirectoryFiles = await this.stagedDirectoryFiles();

    console.log("END:");
    const untrackedFiles: string[] | null = [];
    const modifiedFiles: string[] | null = [];
    filesDirectory?.map((file => {
      const stagingfilePath = path.join(this.stagingPath, file);
      const dirfilePath = path.join(this.cwd, file);
      if (fs.existsSync(stagingfilePath)) {
        // console.log("Staging file path ",stagingfilePath,"dirfilePath",dirfilePath);
        try {
          const contentFileDir = fs.readFileSync(stagingfilePath, "utf-8");
        const contentFileStaging = fs.readFileSync(dirfilePath, "utf-8");
        if (contentFileDir !== contentFileStaging) {
          modifiedFiles.push(file);
        }
        } catch (error) {
          
        }
      }
      else {
        untrackedFiles.push(file);
      }
    }))

    if (untrackedFiles.length > 0) {
      console.log(clc.whiteBright("Use git add . or git add <file> to add to staging area"));
    }
    untrackedFiles.forEach((file) => {
      console.log(clc.red(`Untracked file -> ${file}`));
    });
    modifiedFiles.forEach((file) => {
      console.log(clc.yellow(`Modified file -> ${file.replace("\\","/")}`));
    });
    if (untrackedFiles.length === 0 && modifiedFiles.length === 0) {
      console.log(clc.greenBright("Everything is up to date"));
    }
    
    //! make a fx to delete files automatically
    stagedDirectoryFiles?.forEach((file => {
      const a = file.substring(this.stagingPath.length);
      const checkPath = path.join(this.cwd,a);
      if(!fs.existsSync(checkPath)){
        var  hasExtension: boolean | string = file.includes('.') && file.endsWith('.');
        const stats="";
               if (stats) { 
              hasExtension = 'file'
                } else {
                      hasExtension = 'directory'
                }
        // console.log("STAT",stats);
        // console.log("File not present  in W.DIR",checkPath);
        if (hasExtension==="file") {
          fs.unlinkSync(checkPath);
          // console.log("File deleted:", checkPath);
        } else if (hasExtension==="directory") {
          // For Node.js 12 and later
          fs.rmSync(file, { recursive: true, force: true });
        } 
      }
    }))

  }

  async deleteWasteFilesInStaging(){
    var stagedDirectoryFiles = await this.stagedDirectoryFiles();
    stagedDirectoryFiles?.forEach((file => {
      const a = file.substring(this.stagingPath.length);
      const checkPath = path.join(this.cwd,a);
      if(!fs.existsSync(checkPath)){
        var  hasExtension: boolean | string = file.includes('.') && file.endsWith('.');
        const stats="";
               if (stats) { 
              hasExtension = 'file'
                } else {
                      hasExtension = 'directory'
                }
        // console.log("STAT",stats);
        // console.log("File not present  in W.DIR",checkPath);
        if (hasExtension==="file") {
          fs.unlinkSync(checkPath);
          // console.log("File deleted:", checkPath);
        } else if (hasExtension==="directory") {
          // For Node.js 12 and later
          fs.rmSync(file, { recursive: true, force: true });
        } 
      }
    }))
  }



  async status() {
    await this.checkUpdates();
  }

  async add(file: string) {
    if (file === ".") {

      const filesDir = await this.filesDirectoryToStageEverything();
      // console.log("FILES DIR -> ",filesDir)
      const pathnew = this.cwd;
      filesDir.forEach(async (files) => {
        await this.copyDirectory(path.join(pathnew, files), path.join(this.stagingPath, files))
          .then(() => console.log(''))
          .catch(err => console.error(''));
        // console.log("PAth new ->",path.join(pathnew,files),files,"staging")
        //!
        // this.readDirectory(path.join(pathnew,files),files,"staging");
      })
      console.log(clc.green("Added all the files to staging area"));
      console.log(clc.greenBright("Everything is staged"))
    } else {
      var filePath = path.join(this.cwd, file);
      // console.log(filePath);
      const stats = fs.existsSync(filePath);
      //fs.existsSync(filePath) ? fs.statSync(file) : null;
      if (!stats) {
        return console.log(clc.magentaBright(`${file} does not exist in ${filePath}`));
      }else{
        // console.log("EXists",filePath,path.join(this.stagingPath))
      }
      this.copyDirectory(filePath,path.join(this.stagingPath,file));

      console.log(clc.green(`Added ${file} to staging area`));
    }
  }

  async readDirectory(directoryPath: string, file: string, pathData: string) {
    try {
      const items = fs.readdirSync(directoryPath, { withFileTypes: true });

      for (const item of items) {
        // console.log("-->",directoryPath,file,item.name,pathData);
        var fullPath = path.join(directoryPath, item.name);
        fullPath = fullPath.replace(/\\/g, '/');
        const index = fullPath.indexOf(file);

        if (item.isDirectory()) {
          console.log("D")
          await this.readDirectory(fullPath, file, pathData);

        } else if (item.isFile()) {
          console.log("F")
          const content = fs.readFileSync(fullPath, "utf-8");
          const pathindex = fullPath.slice(index);
          // console.log(`Path:${fullPath.slice(index)}`);
          // console.log(`File: ${fullPath}`);
          // console.log(`Content: ${content}`);
          var firstPath = "";
          if (!fs.existsSync(path.join(this.stagingPath, pathindex))) {
            console.log("Does not Ex")
            const lindex = pathindex.lastIndexOf("/");
            const firstPart = pathindex.slice(0, lindex);
            const filename = pathindex.slice(lindex);
            console.log("First part", firstPart)
            firstPath = pathData === "staging" ? path.join(this.stagingPath, firstPart) : pathData
            console.log("FIRST PATH", firstPath);
            // console.log("Does not exts in OBJ",firstPart,lindex,filename);
            // try {
            //   fs.mkdirSync(firstPath, { recursive: true });
            // } catch (error) {
            //   console.log("ERROR ####",error)
            // }
            // console.log("Content",content);
            try {
              fs.writeFileSync(path.join(firstPath, filename), content);
            } catch (error) {
              console.log("Already added to stage area");
            }
          } else {
            console.log("Exists")
            console.log("FIRST PATH", firstPath);
            const lindex = pathindex.lastIndexOf("/");
            const firstPart = pathindex.slice(0, lindex);
            const filename = pathindex.slice(lindex);
            const firstPathQ = pathData === "staging" ? path.join(this.stagingPath, firstPart) : pathData
            console.log("staging data", firstPathQ);
            try {
              fs.writeFileSync(path.join(firstPathQ, filename), content);
            } catch (error) {
              console.log("->>>>>>", error)
            }
          }
        }
      }
    } catch (error) {
      console.error(`Error reading directory: ${error}`);
    }
  }


  async commit(message: string) {
    console.log("Commit Message : ", message);
    const commitDataPath: string = fs.readFileSync(this.commitsPath, "utf-8");
    const lines = commitDataPath.split('\n').filter(line => line !== '');
    const pathStage: string[] | null = [];
    const stagedFiles: string[] | null = [];

    if (commitDataPath === "") {
      try {
        const files: string[] = await new Promise((resolve, reject) => {
          fs.readdir(this.stagingPath, (err, files) => {
            if (err) {
              reject(err);
            } else {
              resolve(files);
            }
          });
        });
        stagedFiles.push(...files);
      } catch (err) {
        // console.error("Error reading staging directory:", err);
      }
      stagedFiles.forEach(async (file) => {
        pathStage.push(path.join(this.stagingPath, file));
        //!
  
        const path1 = (path.join(this.cwd, "Git-pulse/.gitpulse", "staging"));
        // console.log(path1, path.join(this.objPath, "init"));
        await this.copyDirectory(path1, path.join(this.objPath, "init"))
          .then(() => console.log(''))
          // .catch(err => console.error('Error during copy operation:', err));
      })
      fs.writeFileSync(this.commitsPath,`\ninit:${message}:${new Date()}`);
    }
    else if(lines.length==1){
      console.log("Diff is 1",lines.length-1);
      // return;
      const randomBytes = crypto.randomBytes(20); // 20 bytes * 2 (hex) = 40 characters
      const newCommitId = randomBytes.toString('hex');
      const newCommitIdpath = path.join(this.objPath,newCommitId);
      fs.mkdirSync(newCommitIdpath);
      fs.mkdirSync(path.join(newCommitIdpath,"mdf"));
      fs.writeFileSync(path.join(newCommitIdpath,"ad.txt"),"");
      fs.writeFileSync(path.join(newCommitIdpath,"rm.txt"),"");
      // fs.appendFileSync(this.commitsPath, `\n${message}:${newCommitId}:${new Date()}`);
     try {
      const result = await dirCompare.compare(this.stagingPath, path.join(this.objPath, "init"),{compareContent:true});
      const modifiedFiles:string[]|null = [];
      const addedFiles:string[]|null = [];
      const deletedFiles:string[]|null = [];
      result.diffSet?.forEach((diff,index) => {
          if(diff.state==="distinct"){
            let diffpath1 =  diff.path1 as string;
            let a= path.join(this.cwd,diffpath1.split("staging")[1]);
            // console.log("@@@@@@@@@",path.join(diffpath1,diff.name1 as string))
            try {
              const readingStg = fs.readFileSync(path.join(diffpath1,diff.name1 as string),"utf-8")
              // console.log(readingStg);
              // console.log("###########")
            fs.writeFileSync(path.join(newCommitIdpath,"mdf",`${index}.txt`),
            
            `${path.join(a,diff.name1 as string)}
            \n${readingStg}`
            );
            } catch (error) {
              console.log(error)
            }
            
            modifiedFiles?.push(path.join(a,diff.name1 as string));
           console.log("Modified content",path.join(diff.path1 as string,diff.name1 as string));   
          }
          
          else if(diff.state==="right"){
            let diffpath2 =  diff.path2 as string;
            let a= path.join(this.cwd,diffpath2.split("init")[1]);
            fs.appendFileSync(path.join(newCommitIdpath,"rm.txt"), `\n${path.join(a, diff.name2 as string)}`);
            // console.log("########","@@@",diffpath2.split("init")[1],diffpath2);
            deletedFiles?.push(path.join(a,diff.name2 as string));
            console.log("Deleted files",path.join(diff.path2 as string,diff.name2 as string)); 
          }
          
          else if(diff.state==="left"){
            let diffpath1 =  diff.path1 as string;
            let a= path.join(this.cwd,diffpath1.split("staging")[1]);
            addedFiles?.push(path.join(a,diff.name1 as string));
            fs.appendFileSync(path.join(newCommitIdpath,"ad.txt"), `\n${path.join(a, diff.name1 as string)}`);
            console.log("Added files",path.join(diff.path1 as string,diff.name1 as string)); 
          }
      });
      console.log("M",modifiedFiles);
      console.log("A",addedFiles);
      console.log("D",deletedFiles);
    } catch (error) {
      console.error("Error comparing directories:", error);
    }
    }else{

    }
    console.log(lines.length)
    // console.log(pathStage);
  }




  async copyDirectory(sourceDir: string, destDir: string): Promise<void> {
    try {
      await fsExtra.copy(sourceDir, destDir, {
        overwrite: true, // Overwrites the content if it already exists
        errorOnExist: false // Don't throw an error if the destination exists
      });
      // console.log(`Copied from ${sourceDir} to ${destDir}`);
    } catch (error) {
      // console.error(`Error copying directory: ${error}`);
    }
  }


}

export default Gitpulse;

function createHash({ data = "" }: { data: string }) {
  const hash = crypto.createHash('sha1');
  hash.update(data);
  return hash.digest('hex');
}

const program = new Command();

let gitpulse: Gitpulse | null;
const args = process.argv.slice(2);


program
  .command('status')
  .description('Check the status of the project')
  .action((options, command) => {
    gitpulse = Gitpulse.loadFromConfig();
    if (gitpulse) {
      gitpulse.status();
    } else {
      console.error('Gitpulse not initialized. Please run "init" with the name of the project first.');
    }
  });

program
  .command('init')
  .description('Initialize Gitpulse in project')
  .action((options, command) => {
    gitpulse = new Gitpulse();
    gitpulse.saveToConfig();
  });

program
  .command('commit <message>')
  .description('Commits the project')
  .action((message: string) => {
    gitpulse = Gitpulse.loadFromConfig();
    gitpulse?.commit(message);
  });

program.command('add <action>')
  .description("Add files to stage area")
  .action((action: string) => {
    gitpulse = Gitpulse.loadFromConfig();
    gitpulse?.add(action);
  })


program.parse(process.argv);
