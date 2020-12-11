const fs = require('fs');

/**
 * Read init.ini and return the number in the second row
 * @async
 */

function getExpectedPeakNum(callback) {
    fs.readFile('init.ini', 'utf8' , (err, data) => {
        if (err) {
          console.error(err)
          return;
        }
        let parameters = data.toString().split("\n");
        console.log("parameters[1]", parameters[1])
        return callback(null, parameters[1]);
      })
    
}
module.exports = getExpectedPeakNum;