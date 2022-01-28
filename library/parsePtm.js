const fs = require('fs');
const readline = require('readline');
const fixedPtmTitle = "Fixed PTMs BEGIN";
const fixedPtmTitleEnd = "Fixed PTMs END";
const commonPtmTitle = "PTMs for MIScore BEGIN";
const commonPtmTitleEnd = "PTMs for MIScore END";
const varPtmTitle = "********************** Variable PTM **********************";
const paramTitle = "********************** Parameters **********************";

/**
 * Parse identification file and return ptm data
 * @param {string} tsvFile - tsv file path
 * @param {function} callback - Callback function that handles query results
 * @returns {function} Callback function
 * @sync
 */
function parsePtm(tsvFile, callback) {
    let isReadingParam = false;
    let fixedPtm = false;
    let commonPtm = false;
    let varPtm = false;

    let fixedPtms = [];
    let commonPtms = [];
    let varPtms = [];
    console.log("tsvfile", tsvFile);
    try {
        const readInterface = readline.createInterface({
            input: fs.createReadStream(tsvFile).on('error', function(err) {
                throw err;
            })
        });
    
        readInterface.on('line', function(line) {
            if (line.includes(fixedPtmTitle)) {
                fixedPtm = true;
            }
            else if (line.includes(commonPtmTitle)) {
                commonPtm = true;
            }
            else if (line.includes(fixedPtmTitleEnd)) {
                fixedPtm = false;
            }
            else if(line.includes(commonPtmTitleEnd)) {
                commonPtm = false;
            }
            if (fixedPtm || commonPtm || varPtm) {
                let ptmInfo = line.split("\t");
                if (ptmInfo.length == 3) {
                    let ptmName = ptmInfo[0].trim();
                    let ptmMass = ptmInfo[1].trim();

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
        });
        readInterface.on('close', function() {
            let ptm = {};
            ptm["fixedPtms"] = fixedPtms;
            ptm["varPtms"] = varPtms;
            ptm["commonPtms"] = commonPtms;
            console.log("ptm", ptm);
            callback(null, ptm);    
        })
    } catch(err) {
        console.log(err);
        callback(err, null);
    }
}
module.exports = parsePtm;