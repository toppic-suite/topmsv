const fs = require('fs');
const readline = require('readline');
const fixedPtmTitle = "********************** Fixed PTM **********************";
const commonPtmTitle = "********************** Common PTM **********************";
const varPtmTitle = "********************** Variable PTM **********************";
/**
 * Parse tsv file and return ptm data
 * @param {string} tsvFile - tsv file path
 * @sync
 */
function parsePtm(tsvFile, callback) {
    let fixedPtm = false;
    let commonPtm = false;
    let varPtm = false;

    let fixedPtms = [];
    let commonPtms = [];
    let varPtms = [];

    const readInterface = readline.createInterface({
        input: fs.createReadStream(tsvFile)
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
}
module.exports = parsePtm;