const fs = require('fs');
const path = require('path');
/**
 * Delete uploaded msalign files in the project data folder
 * @param {string} ProjectDir - project data directory
 */
async function deleteEnvFile(projectDir) {
  try {
    let folderPath = projectDir.slice(0, projectDir.lastIndexOf(path.sep));
    let specFile = projectDir.slice(projectDir.lastIndexOf(path.sep) + 1);
    let specFileName = specFile.slice(0, specFile.lastIndexOf("."));

    let ms1MsalignFolder = path.join(folderPath, specFileName + "_file");
    let ms1MsalignPathWithFolder = path.join(folderPath, specFileName + "_file", specFileName + "_ms1.msalign"); 
    let ms1MsalignPathNoFolder = path.join(folderPath, specFileName + "_ms1.msalign"); 
    let ms2MsalignPath = path.join(folderPath, specFileName + "_ms2.msalign"); 

    try {
      if (fs.existsSync(ms1MsalignFolder)) {
        if (fs.existsSync(ms1MsalignPathWithFolder)) {
          await fs.unlink(ms1MsalignPathWithFolder, (err) => {
            if (err) {
              console.error(err);
            }
            console.log("ms1 file processed");
          })
        }
      } else {
        if (fs.existsSync(ms1MsalignPathNoFolder)) {
          await fs.unlink(ms1MsalignPathNoFolder, (err) => {
            if (err) {
              console.error(err);
            }
            console.log("ms1 file processed");
            return;
          })
        }
      }
      if (fs.existsSync(ms2MsalignPath)) {
        await fs.unlink(ms2MsalignPath, (err) => {
          if (err) {
            console.error(err);
          }
          console.log("ms2 file processed");
          return;
        })
      }
    } catch(err) {
      console.error(err);
    }
  } catch(err) {
    console.error(err);
  }
}
module.exports = deleteEnvFile;
