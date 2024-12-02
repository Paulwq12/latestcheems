const { Dropbox } = require('dropbox');
const fs = require('fs');
const axios = require('axios')
const _math = require('mathjs')
const _url = require('url')
const qs = require('qs')
const querystring = require('querystring');
const request = require('request');

// Initialize Dropbox
const dropbox = new Dropbox({
    accessToken: 'sl.CByzPa17Yy-lTmULi8SuYIhj4kSGAmhjexIQqUM2M3RWZ76SK51VnzXlvBvf54P-67dPUHQg226QY-7t6_o8RweVXVTzcHt8PwZFCUfMIx9iY-zaqP_27mp-Nc8BM74ef2Ks4-6cpfaO_nk', // Replace with your Dropbox token
});

// File Databases
const videoDbPath = './XeonMedia/database/xeonvideo.json';
const zipDbPath = './XeonMedia/database/xeonzip.json';

// Dropbox Folder Paths
const videoFolderPath = '/Videos';
const zipFolderPath = '/Zips';

// Helper: Read a JSON database
const readDatabase = (dbPath) => {
    if (fs.existsSync(dbPath)) {
        return JSON.parse(fs.readFileSync(dbPath));
    }
    return [];
};

// Helper: Save a JSON database
const saveDatabase = (dbPath, data) => {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
};

// Validate Dropbox Token
const validateTokenScopes = async () => {
    try {
        const response = await dropbox.usersGetCurrentAccount();
        if (!response) {
            throw new Error('Unable to validate token. Please check your token.');
        }
        console.log(`Token validated for account: ${response.result.email}`);
    } catch (error) {
        console.error('Error validating token:', error.message);
        throw new Error('Invalid or expired access token. Please generate a new token with the correct scopes.');
    }
};

// Ensure folder exists in Dropbox
const ensureFolderExists = async (folderPath) => {
    try {
        // List folder metadata to check if it exists
        await dropbox.filesGetMetadata({ path: folderPath });
        console.log(`Folder "${folderPath}" already exists.`);
    } catch (error) {
        if (error.error?.error_summary?.startsWith('path/not_found')) {
            // Folder doesn't exist, so create it
            await dropbox.filesCreateFolderV2({ path: folderPath });
            console.log(`Folder "${folderPath}" created successfully.`);
        } else {
            // Propagate unexpected errors
            console.error('Error ensuring folder existence:', error.message);
            throw error;
        }
    }
};

// Upload file to Dropbox
const uploadFileToDropbox = async (folderPath, fileName, fileBuffer) => {
    try {
        await validateTokenScopes(); // Ensure valid token
        await ensureFolderExists(folderPath); // Ensure the folder exists

        // Upload file to the folder
        await dropbox.filesUpload({
            path: `${folderPath}/${fileName}`,
            contents: fileBuffer,
            mode: { '.tag': 'add' }, // Add a unique suffix if file with the same name exists
        });

        console.log(`File "${fileName}" uploaded successfully to Dropbox.`);
    } catch (error) {
        console.error('Error uploading file to Dropbox:', error.message);
        throw error;
    }
};

// Add a video
exports.addvideo = async (videoName, videoBuffer) => {
    const videoDb = readDatabase(videoDbPath);
    if (videoDb.some((v) => v.name === videoName)) {
        throw new Error('The name is already in use');
    }

    // Upload to Dropbox
    const fileName = `${videoName}.mp4`;
    await uploadFileToDropbox(videoFolderPath, fileName, videoBuffer);

   // Update the local database
        const dropboxPath = `${videoFolderPath}/${fileName}`;
        videoDb.push({ name: videoName, path: dropboxPath });
        saveDatabase(videoDbPath, videoDb);
   

    return `Video "${videoName}" added successfully to Dropbox.`;
};

// List videos
exports.listvideos = () => {
    const videoDb = readDatabase(videoDbPath);
    if (videoDb.length === 0) return 'No videos available in the database.';
    let list = '┌──⭓「 *Video List* 」\n│\n';
    videoDb.forEach(video => {
        list += `│⭔ ${video.name}\n`;
    });
    list += `│\n└────────────⭓\n\n*Total videos: ${videoDb.length}*`;
    return list;
};

// Get a video
exports.getvideo = async (videoName) => {
    const videoDb = readDatabase(videoDbPath);
    const video = videoDb.find(v => v.name === videoName);
    if (!video) throw new Error('The video does not exist in the database.');

    const response = await dropbox.filesDownload({ path: video.path });
    return {
        videoBuffer: Buffer.from(response.result.fileBinary),
        caption: `Here is the video: ${videoName}`,
    };
};

// Delete a video
exports.delvideo = async (videoName) => {
    const videoDb = readDatabase(videoDbPath);
    const videoIndex = videoDb.findIndex(v => v.name === videoName);
    if (videoIndex === -1) throw new Error('The video does not exist in the database.');

    await dropbox.filesDeleteV2({ path: videoDb[videoIndex].path });
    videoDb.splice(videoIndex, 1);
    saveDatabase(videoDbPath, videoDb);

    return `Video "${videoName}" deleted successfully from Dropbox.`;
};

// Add a zip file
exports.addzip = async (zipName, zipBuffer) => {
    const zipDb = readDatabase(zipDbPath);
    if (zipDb.some(z => z.name === zipName)) {
        throw new Error('The name is already in use');
    }

    // Upload to Dropbox
    const fileName = `${zipName}.zip`;
    await uploadFileToDropbox(zipFolderPath, fileName, zipBuffer);

    // Update zip database
    zipDb.push({ name: zipName, path: `${zipFolderPath}/${fileName}` });
    saveDatabase(zipDbPath, zipDb);

    return `Zip file "${zipName}" added successfully to Dropbox.`;
};

// List zip files
exports.listzip = () => {
    const zipDb = readDatabase(zipDbPath);
    if (zipDb.length === 0) return 'No zip files available in the database.';
    let list = '┌──⭓「 *ZIP List* 」\n│\n';
    zipDb.forEach(zip => {
        list += `│⭔ ${zip.name}\n`;
    });
    list += `│\n└────────────⭓\n\n*Total zip files: ${zipDb.length}*`;
    return list;
};

// Get a zip file
exports.getzip = async (zipName) => {
    const zipDb = readDatabase(zipDbPath);
    const zip = zipDb.find(z => z.name === zipName);
    if (!zip) throw new Error('The zip file does not exist in the database.');

    const response = await dropbox.filesDownload({ path: zip.path });
    return {
        zipBuffer: Buffer.from(response.result.fileBinary),
        caption: `Here is the zip file: ${zipName}`,
    };
};

// Delete a zip file
exports.delzip = async (zipName) => {
    const zipDb = readDatabase(zipDbPath);
    const zipIndex = zipDb.findIndex(z => z.name === zipName);
    if (zipIndex === -1) throw new Error('The zip file does not exist in the database.');

    await dropbox.filesDeleteV2({ path: zipDb[zipIndex].path });
    zipDb.splice(zipIndex, 1);
    saveDatabase(zipDbPath, zipDb);

    return `Zip file "${zipName}" deleted successfully from Dropbox.`;
};


