"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const crypto_1 = __importDefault(require("crypto"));
const dirCompare = __importStar(require("dir-compare"));
const cli_color_1 = __importDefault(require("cli-color"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const klaw_1 = __importDefault(require("klaw"));
var configPath = path_1.default.join(process.cwd(), "/.gitpulse/config.json");
class Gitpulse {
    constructor() {
        this.rootpath = '';
        this.gitpath = '';
        this.objPath = "";
        this.stagingPath = "";
        this.commitsPath = "";
        this.configPath = "";
        this.cwd = "";
        this.rootpath = path_1.default.join(process.cwd());
        this.gitpath = path_1.default.join(this.rootpath, ".gitpulse");
        this.objPath = path_1.default.join(this.gitpath, "obj");
        this.stagingPath = path_1.default.join(this.gitpath, "staging");
        this.commitsPath = path_1.default.join(this.gitpath, "commits.txt");
        if (!fs_1.default.existsSync(path_1.default.join(this.gitpath))) {
            console.log("No git directory exists");
        }
        this.cwd = path_1.default.join(process.cwd(), "../");
        this.init();
    }
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            const gitExists = fs_1.default.existsSync(this.gitpath);
            if (!gitExists) {
                try {
                    fs_1.default.mkdir(this.gitpath, { recursive: true }, (err) => {
                        console.log(err);
                    });
                    fs_1.default.writeFileSync(this.commitsPath, "");
                    fs_1.default.mkdir(this.stagingPath, { recursive: true }, (err) => {
                        console.log(err);
                    });
                    fs_1.default.mkdir(path_1.default.join(this.objPath, "init"), { recursive: true }, (err) => {
                        console.log(err);
                    });
                    fs_1.default.mkdir(`${this.objPath}/init`, { recursive: true }, (err) => {
                        console.log(err);
                    });
                }
                catch (error) {
                    console.log(error);
                }
            }
            else {
                // setInterval(() => this.deleteWasteFilesInStaging(), 15000);
                // console.log(".gitpulse aleady exists");
            }
        });
    }
    static loadFromConfig() {
        if (fs_1.default.existsSync(configPath)) {
            return new Gitpulse();
        }
        return null;
    }
    saveToConfig() {
        const config = {
            fileName: process.cwd(),
        };
        fs_1.default.writeFileSync(configPath, JSON.stringify(config), 'utf-8');
    }
    filesDirectory() {
        return new Promise((resolve, reject) => {
            const directories = [];
            (0, klaw_1.default)(path_1.default.join(this.cwd))
                .on('data', (item) => {
                if (item.path.includes("Git-pulse") || item.path.includes(".git")) {
                }
                else if (item.stats.isDirectory()) {
                    fs_1.default.readdir(item.path, (err, files) => {
                        // console.log(item.path,files);
                        if (files.length === 0) {
                            directories.push(item.path);
                        }
                    });
                }
                else if (item.stats.isFile()) {
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
    stagedDirectoryFiles() {
        return new Promise((resolve, reject) => {
            const directories = [];
            (0, klaw_1.default)(path_1.default.join(this.stagingPath))
                .on('data', (item) => {
                // if (item.stats.isFile()) {
                // console.log(item.path)
                if (item.stats.isDirectory()) {
                    fs_1.default.readdir(item.path, (err, files) => {
                        // console.log(item.path,files);
                        if (files.length === 0) {
                            directories.push(item.path);
                        }
                    });
                }
                else if (item.stats.isFile()) {
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
    filesDirectoryToStageEverything() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                const files = fs_1.default.readdir(this.cwd, (err, files) => {
                    if (err) {
                        console.error('Error reading directory:', err);
                        reject(err);
                    }
                    const filteredFiles = files.filter(file => {
                        const fileName = file;
                        return !fileName.startsWith('Git-pulse') &&
                            !fileName.includes('.git') &&
                            !fileName.includes('.gitpulse') &&
                            !fileName.includes('node_modules') &&
                            !fileName.includes('package');
                        // &&
                        // !fileName.startsWith('tsconfig') &&
                        // !fileName.startsWith('src') &&
                        // !fileName.startsWith('dist');
                    });
                    resolve(filteredFiles);
                });
            });
        });
    }
    checkUpdates() {
        return __awaiter(this, void 0, void 0, function* () {
            //! very inefficient
            let filesDirectory = yield this.filesDirectory();
            filesDirectory = filesDirectory.map((file) => {
                return file.substring(this.cwd.length);
            });
            var stagedDirectoryFiles = yield this.stagedDirectoryFiles();
            console.log("END:");
            const untrackedFiles = [];
            const modifiedFiles = [];
            filesDirectory === null || filesDirectory === void 0 ? void 0 : filesDirectory.map((file => {
                const stagingfilePath = path_1.default.join(this.stagingPath, file);
                const dirfilePath = path_1.default.join(this.cwd, file);
                if (fs_1.default.existsSync(stagingfilePath)) {
                    // console.log("Staging file path ",stagingfilePath,"dirfilePath",dirfilePath);
                    try {
                        const contentFileDir = fs_1.default.readFileSync(stagingfilePath, "utf-8");
                        const contentFileStaging = fs_1.default.readFileSync(dirfilePath, "utf-8");
                        if (contentFileDir !== contentFileStaging) {
                            modifiedFiles.push(file);
                        }
                    }
                    catch (error) {
                    }
                }
                else {
                    untrackedFiles.push(file);
                }
            }));
            if (untrackedFiles.length > 0) {
                console.log(cli_color_1.default.whiteBright("Use git add . or git add <file> to add to staging area"));
            }
            untrackedFiles.forEach((file) => {
                console.log(cli_color_1.default.red(`Untracked file -> ${file}`));
            });
            modifiedFiles.forEach((file) => {
                console.log(cli_color_1.default.yellow(`Modified file -> ${file.replace("\\", "/")}`));
            });
            if (untrackedFiles.length === 0 && modifiedFiles.length === 0) {
                console.log(cli_color_1.default.greenBright("Everything is up to date"));
            }
            //! make a fx to delete files automatically
            stagedDirectoryFiles === null || stagedDirectoryFiles === void 0 ? void 0 : stagedDirectoryFiles.forEach((file => {
                const a = file.substring(this.stagingPath.length);
                const checkPath = path_1.default.join(this.cwd, a);
                if (!fs_1.default.existsSync(checkPath)) {
                    var hasExtension = file.includes('.') && file.endsWith('.');
                    const stats = "";
                    if (stats) {
                        hasExtension = 'file';
                    }
                    else {
                        hasExtension = 'directory';
                    }
                    // console.log("STAT",stats);
                    // console.log("File not present  in W.DIR",checkPath);
                    if (hasExtension === "file") {
                        fs_1.default.unlinkSync(checkPath);
                        // console.log("File deleted:", checkPath);
                    }
                    else if (hasExtension === "directory") {
                        // For Node.js 12 and later
                        fs_1.default.rmSync(file, { recursive: true, force: true });
                    }
                }
            }));
        });
    }
    deleteWasteFilesInStaging() {
        return __awaiter(this, void 0, void 0, function* () {
            var stagedDirectoryFiles = yield this.stagedDirectoryFiles();
            stagedDirectoryFiles === null || stagedDirectoryFiles === void 0 ? void 0 : stagedDirectoryFiles.forEach((file => {
                const a = file.substring(this.stagingPath.length);
                const checkPath = path_1.default.join(this.cwd, a);
                if (!fs_1.default.existsSync(checkPath)) {
                    var hasExtension = file.includes('.') && file.endsWith('.');
                    const stats = "";
                    if (stats) {
                        hasExtension = 'file';
                    }
                    else {
                        hasExtension = 'directory';
                    }
                    // console.log("STAT",stats);
                    // console.log("File not present  in W.DIR",checkPath);
                    if (hasExtension === "file") {
                        fs_1.default.unlinkSync(checkPath);
                        // console.log("File deleted:", checkPath);
                    }
                    else if (hasExtension === "directory") {
                        // For Node.js 12 and later
                        fs_1.default.rmSync(file, { recursive: true, force: true });
                    }
                }
            }));
        });
    }
    status() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.checkUpdates();
        });
    }
    add(file) {
        return __awaiter(this, void 0, void 0, function* () {
            if (file === ".") {
                const filesDir = yield this.filesDirectoryToStageEverything();
                // console.log("FILES DIR -> ",filesDir)
                const pathnew = this.cwd;
                filesDir.forEach((files) => __awaiter(this, void 0, void 0, function* () {
                    yield this.copyDirectory(path_1.default.join(pathnew, files), path_1.default.join(this.stagingPath, files))
                        .then(() => console.log(''))
                        .catch(err => console.error(''));
                    // console.log("PAth new ->",path.join(pathnew,files),files,"staging")
                    //!
                    // this.readDirectory(path.join(pathnew,files),files,"staging");
                }));
                console.log(cli_color_1.default.green("Added all the files to staging area"));
                console.log(cli_color_1.default.greenBright("Everything is staged"));
            }
            else {
                var filePath = path_1.default.join(this.cwd, file);
                // console.log(filePath);
                const stats = fs_1.default.existsSync(filePath);
                //fs.existsSync(filePath) ? fs.statSync(file) : null;
                if (!stats) {
                    return console.log(cli_color_1.default.magentaBright(`${file} does not exist in ${filePath}`));
                }
                else {
                    // console.log("EXists",filePath,path.join(this.stagingPath))
                }
                this.copyDirectory(filePath, path_1.default.join(this.stagingPath, file));
                console.log(cli_color_1.default.green(`Added ${file} to staging area`));
            }
        });
    }
    readDirectory(directoryPath, file, pathData) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const items = fs_1.default.readdirSync(directoryPath, { withFileTypes: true });
                for (const item of items) {
                    // console.log("-->",directoryPath,file,item.name,pathData);
                    var fullPath = path_1.default.join(directoryPath, item.name);
                    fullPath = fullPath.replace(/\\/g, '/');
                    const index = fullPath.indexOf(file);
                    if (item.isDirectory()) {
                        console.log("D");
                        yield this.readDirectory(fullPath, file, pathData);
                    }
                    else if (item.isFile()) {
                        console.log("F");
                        const content = fs_1.default.readFileSync(fullPath, "utf-8");
                        const pathindex = fullPath.slice(index);
                        // console.log(`Path:${fullPath.slice(index)}`);
                        // console.log(`File: ${fullPath}`);
                        // console.log(`Content: ${content}`);
                        var firstPath = "";
                        if (!fs_1.default.existsSync(path_1.default.join(this.stagingPath, pathindex))) {
                            console.log("Does not Ex");
                            const lindex = pathindex.lastIndexOf("/");
                            const firstPart = pathindex.slice(0, lindex);
                            const filename = pathindex.slice(lindex);
                            console.log("First part", firstPart);
                            firstPath = pathData === "staging" ? path_1.default.join(this.stagingPath, firstPart) : pathData;
                            console.log("FIRST PATH", firstPath);
                            // console.log("Does not exts in OBJ",firstPart,lindex,filename);
                            // try {
                            //   fs.mkdirSync(firstPath, { recursive: true });
                            // } catch (error) {
                            //   console.log("ERROR ####",error)
                            // }
                            // console.log("Content",content);
                            try {
                                fs_1.default.writeFileSync(path_1.default.join(firstPath, filename), content);
                            }
                            catch (error) {
                                console.log("Already added to stage area");
                            }
                        }
                        else {
                            console.log("Exists");
                            console.log("FIRST PATH", firstPath);
                            const lindex = pathindex.lastIndexOf("/");
                            const firstPart = pathindex.slice(0, lindex);
                            const filename = pathindex.slice(lindex);
                            const firstPathQ = pathData === "staging" ? path_1.default.join(this.stagingPath, firstPart) : pathData;
                            console.log("staging data", firstPathQ);
                            try {
                                fs_1.default.writeFileSync(path_1.default.join(firstPathQ, filename), content);
                            }
                            catch (error) {
                                console.log("->>>>>>", error);
                            }
                        }
                    }
                }
            }
            catch (error) {
                console.error(`Error reading directory: ${error}`);
            }
        });
    }
    commit(message) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            console.log("Commit Message : ", message);
            const commitDataPath = fs_1.default.readFileSync(this.commitsPath, "utf-8");
            const lines = commitDataPath.split('\n').filter(line => line !== '');
            const pathStage = [];
            const stagedFiles = [];
            if (commitDataPath === "") {
                try {
                    const files = yield new Promise((resolve, reject) => {
                        fs_1.default.readdir(this.stagingPath, (err, files) => {
                            if (err) {
                                reject(err);
                            }
                            else {
                                resolve(files);
                            }
                        });
                    });
                    stagedFiles.push(...files);
                }
                catch (err) {
                    // console.error("Error reading staging directory:", err);
                }
                stagedFiles.forEach((file) => __awaiter(this, void 0, void 0, function* () {
                    pathStage.push(path_1.default.join(this.stagingPath, file));
                    //!
                    const path1 = (path_1.default.join(this.cwd, "Git-pulse/.gitpulse", "staging"));
                    // console.log(path1, path.join(this.objPath, "init"));
                    yield this.copyDirectory(path1, path_1.default.join(this.objPath, "init"))
                        .then(() => console.log(''));
                    // .catch(err => console.error('Error during copy operation:', err));
                }));
                fs_1.default.writeFileSync(this.commitsPath, `\ninit:${message}:${new Date()}`);
            }
            else if (lines.length == 1) {
                console.log("Diff is 1", lines.length - 1);
                // return;
                const randomBytes = crypto_1.default.randomBytes(20); // 20 bytes * 2 (hex) = 40 characters
                const newCommitId = randomBytes.toString('hex');
                const newCommitIdpath = path_1.default.join(this.objPath, newCommitId);
                fs_1.default.mkdirSync(newCommitIdpath);
                fs_1.default.mkdirSync(path_1.default.join(newCommitIdpath, "mdf"));
                fs_1.default.writeFileSync(path_1.default.join(newCommitIdpath, "ad.txt"), "");
                fs_1.default.writeFileSync(path_1.default.join(newCommitIdpath, "rm.txt"), "");
                // fs.appendFileSync(this.commitsPath, `\n${message}:${newCommitId}:${new Date()}`);
                try {
                    const result = yield dirCompare.compare(this.stagingPath, path_1.default.join(this.objPath, "init"), { compareContent: true });
                    const modifiedFiles = [];
                    const addedFiles = [];
                    const deletedFiles = [];
                    (_a = result.diffSet) === null || _a === void 0 ? void 0 : _a.forEach((diff, index) => {
                        if (diff.state === "distinct") {
                            let diffpath1 = diff.path1;
                            let a = path_1.default.join(this.cwd, diffpath1.split("staging")[1]);
                            // console.log("@@@@@@@@@",path.join(diffpath1,diff.name1 as string))
                            try {
                                const readingStg = fs_1.default.readFileSync(path_1.default.join(diffpath1, diff.name1), "utf-8");
                                // console.log(readingStg);
                                // console.log("###########")
                                fs_1.default.writeFileSync(path_1.default.join(newCommitIdpath, "mdf", `${index}.txt`), `${path_1.default.join(a, diff.name1)}
            \n${readingStg}`);
                            }
                            catch (error) {
                                console.log(error);
                            }
                            modifiedFiles === null || modifiedFiles === void 0 ? void 0 : modifiedFiles.push(path_1.default.join(a, diff.name1));
                            console.log("Modified content", path_1.default.join(diff.path1, diff.name1));
                        }
                        else if (diff.state === "right") {
                            let diffpath2 = diff.path2;
                            let a = path_1.default.join(this.cwd, diffpath2.split("init")[1]);
                            fs_1.default.appendFileSync(path_1.default.join(newCommitIdpath, "rm.txt"), `\n${path_1.default.join(a, diff.name2)}`);
                            // console.log("########","@@@",diffpath2.split("init")[1],diffpath2);
                            deletedFiles === null || deletedFiles === void 0 ? void 0 : deletedFiles.push(path_1.default.join(a, diff.name2));
                            console.log("Deleted files", path_1.default.join(diff.path2, diff.name2));
                        }
                        else if (diff.state === "left") {
                            let diffpath1 = diff.path1;
                            let a = path_1.default.join(this.cwd, diffpath1.split("staging")[1]);
                            addedFiles === null || addedFiles === void 0 ? void 0 : addedFiles.push(path_1.default.join(a, diff.name1));
                            fs_1.default.appendFileSync(path_1.default.join(newCommitIdpath, "ad.txt"), `\n${path_1.default.join(a, diff.name1)}`);
                            console.log("Added files", path_1.default.join(diff.path1, diff.name1));
                        }
                    });
                    console.log("M", modifiedFiles);
                    console.log("A", addedFiles);
                    console.log("D", deletedFiles);
                }
                catch (error) {
                    console.error("Error comparing directories:", error);
                }
            }
            else {
            }
            console.log(lines.length);
        });
    }
    copyDirectory(sourceDir, destDir) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield fs_extra_1.default.copy(sourceDir, destDir, {
                    overwrite: true, // Overwrites the content if it already exists
                    errorOnExist: false // Don't throw an error if the destination exists
                });
                // console.log(`Copied from ${sourceDir} to ${destDir}`);
            }
            catch (error) {
                // console.error(`Error copying directory: ${error}`);
            }
        });
    }
}
exports.default = Gitpulse;
function createHash({ data = "" }) {
    const hash = crypto_1.default.createHash('sha1');
    hash.update(data);
    return hash.digest('hex');
}
const program = new commander_1.Command();
let gitpulse;
const args = process.argv.slice(2);
program
    .command('status')
    .description('Check the status of the project')
    .action((options, command) => {
    gitpulse = Gitpulse.loadFromConfig();
    if (gitpulse) {
        gitpulse.status();
    }
    else {
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
    .action((message) => {
    gitpulse = Gitpulse.loadFromConfig();
    gitpulse === null || gitpulse === void 0 ? void 0 : gitpulse.commit(message);
});
program.command('add <action>')
    .description("Add files to stage area")
    .action((action) => {
    gitpulse = Gitpulse.loadFromConfig();
    gitpulse === null || gitpulse === void 0 ? void 0 : gitpulse.add(action);
});
program.parse(process.argv);
