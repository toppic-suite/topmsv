const fs = require('fs');
const readline = require('readline');

const fixedPtmTitle: string = "Fixed PTMs BEGIN";
const fixedPtmTitleEnd: string = "Fixed PTMs END";
const commonPtmTitle: string = "PTMs for MIScore BEGIN";
const commonPtmTitleEnd: string = "PTMs for MIScore END";
const varPtmTitle: string = "********************** Variable PTM **********************";
const paramTitle: string = "********************** Parameters **********************";

/**
 * Parse identification file and return ptm data
 * @param {string} tsvFile - tsv file path
 * @param {function} callback - Callback function that handles query results
 * @returns {function} Callback function
 * @sync
 */
function parsePtm(tsvFile: string, callback: Function) {
    let fixedPtm: boolean = false;
    let commonPtm: boolean = false;
    let varPtm: boolean = false;

    let fixedPtms = [] as {"name": string, "mass": string}[];
    let commonPtms = [] as {"name": string, "mass": string}[];
    let varPtms = [] as {"name": string, "mass": string}[];

    try {
        const readInterface = readline.createInterface({
            input: fs.createReadStream(tsvFile).on('error', function(err) {
                throw err;
            })
        });
    
        readInterface.on('line', function(line: string) {
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
                let ptmInfo: string[] = line.split("\t");
                if (ptmInfo.length == 3) {
                    let ptmName: string = ptmInfo[0].trim();
                    let ptmMass: string = ptmInfo[1].trim();

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
            let ptm: {} = {};
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