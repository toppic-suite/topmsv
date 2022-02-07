const fs = require('fs');
/**
 * Delete uploaded sequence file in the project data folder
 * @param {string} projectDir - Project data directory
 */
function deleteSeqFile(projectDir) {
  try {
    let idx = projectDir.indexOf(".mzML");
    let filePath = (projectDir.slice(0, idx)).concat("_ms2_toppic_prsm_single.tsv");
  
    //there is only going to be one of these two files at one time in the folder
    try {
      if (!fs.existsSync(filePath)) {
        filePath = (filePath.slice(0, idx)).concat("_ms2_toppic_prsm.tsv");
      }
      if (!fs.existsSync(filePath)) {
          filePath = "";//no seq file has been uploaded yet
        }
    } catch(err) {
      console.error(err);
    }
  
    if (filePath != "") {
      fs.unlink(filePath, (err) => {
          if (err) {
            console.error(err);
          } 
          return;
        })
    }
  } catch(err) {
    console.error(err);
  }
}
module.exports = deleteSeqFile;