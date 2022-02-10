const fs = require('fs');
const path = require('path');
/**
 * Delete uploaded feature file in the project data folder
 * @param {string} ProjectDir - project data directory
 */
function deleteFeatureFile(projectDir) {
    try {
      let folderPath = projectDir.slice(0, projectDir.lastIndexOf(path.sep));
      let specFile = projectDir.slice(projectDir.lastIndexOf(path.sep) + 1);
      let specFileName = specFile.slice(0, specFile.lastIndexOf("."));
  
      let featureFolder = path.join(folderPath, specFileName + "_file");
      let featurePathWithFolder = path.join(folderPath, specFileName + "_file", specFileName + "_frac.mzrt.csv"); 
      let featurePathNoFolder = path.join(folderPath, specFileName + "_frac.mzrt.csv"); 
  
      try {
        if (fs.existsSync(featureFolder)) {
          if (fs.existsSync(featurePathWithFolder)) {
            fs.unlink(featurePathWithFolder, (err) => {
              if (err) {
                console.error(err);
              }
            })
          }
        } else {
          if (fs.existsSync(featurePathNoFolder)) {
            fs.unlink(featurePathNoFolder, (err) => {
              if (err) {
                console.error(err);
              }
              return;
            })
          }
        }
      } catch(err) {
        console.error(err);
      }
    } catch(err) {
      console.error(err);
    }
  }
  module.exports = deleteFeatureFile;
  