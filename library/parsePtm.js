const fs = require('fs');
const readline = require('readline');
const fixedPtmTitle = "********************** Fixed PTM **********************";
const commonPtmTitle = "********************** Common PTM **********************";
const varPtmTitle = "********************** Variable PTM **********************";
/**
 * Parse identification file and return ptm data
 * @param {string} tsvFile - tsv file path
 * @param {function} callback - Callback function that handles query results
 * @returns {function} Callback function
 * @sync
 */
function parsePtm(tsvFile, callback) {
    let fixedPtm = false;
    let commonPtm = false;
    let varPtm = false;

    let fixedPtms = [];
    let commonPtms = [];
    let varPtms = [];

    try {
        const readInterface = readline.createInterface({
            input: fs.createReadStream(tsvFile).on('error', function(err) {
                throw err;
            })
        });
    
        readInterface.on('line', function(line) {
            if (fixedPtm || commonPtm || varPtm) {
                let idx = line.indexOf('\t');
                if (idx > -1) {
                    let ptmName = (line.slice(0, idx)).trim();
                    let ptmMass = (line.slice(idx + 1)).trim(); 
                    if (fixedPtm) {
                        fixedPtms.push({"name": ptmName, "mass": ptmMass});
                    }
                    else if (commonPtm) {
                        commonPtms.push({"name": ptmName, "mass": ptmMass});
                    }
                    else{
                        varPtms.push({"name": ptmName, "mass": ptmMass});
                    }
                }
            }
            if (line == fixedPtmTitle) {
                if (fixedPtm){
                    fixedPtm = false;
                }
                else{
                    fixedPtm = true;
                }
            }
            else if (line == commonPtmTitle) {
                if (commonPtm){
                    commonPtm = false;
                }
                else{
                    commonPtm = true;
                }
            }
            else if (line == varPtmTitle) {
                if (varPtm){
                    varPtm = false;
                }
                else{
                    varPtm = true;
                }
            }
        });
        readInterface.on('close', function() {
            let ptm = {};
            ptm["fixedPtms"] = fixedPtms;
            ptm["varPtms"] = varPtms;
            ptm["commonPtms"] = commonPtms;
            callback(null, ptm);    
        })
    } catch(err) {
        console.log(err);
        callback(err, null);
    }
}
module.exports = parsePtm;