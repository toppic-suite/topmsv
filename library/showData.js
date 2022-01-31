let times = 0;
let result=[];
const getEnvNum = require("./getEnvNum");
const getEnvPeakList = require("./getEnvPeakList");

/**
 * Helper function for router envlist
 * @param {sqliteDB} resultDB - Sqlite database
 * @param {number} scan_id - Scan number
 * @param {object} res - Response
 */
function showData(resultDB,scan_id,res) {
    getEnvNum(resultDB, scan_id, function (err, rows) {
        // console.log(rows.length);
        // console.log(typeof rows);

        if (rows == undefined || rows == null){
            //console.log("Empty rows!");
            res.write("0");
            res.end();
            resultDB.close();
            return;
        }

        let max = rows.length;

        if (rows.length === 0){
            //console.log("Empty rows!");
            res.write("0");
            res.end();
            resultDB.close();
        }
        else {
            rows.forEach(envelope => {
                let id = envelope.id;
                let charge = envelope.charge;
                let mono_mass = envelope.mono_mass;
                let oneEnvelope = {};
                oneEnvelope.mono_mass = mono_mass;
                oneEnvelope.charge = charge;
                getEnvPeakList(resultDB,id, function(err, rows) {
                    oneEnvelope.env_peaks=rows;
                    result.push(oneEnvelope);
                    ++times;
                    if(times === max){
                        // console.log('envlist return: ',JSON.stringify(result));
                        res.write(JSON.stringify(result));
                        res.end();
                        times = 0;
                        result = [];
                        resultDB.close();
                    }
                });
            });
        }
    });
}
module.exports = showData;