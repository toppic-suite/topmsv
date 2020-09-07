$( document ).ready(function() {
    let min = document.getElementById("rangeMin").value;
    if($('#envStatus').val() === "0"){
        $('#brhr').hide();
        $("#envInfo").hide();
        $('#envFileInfo').hide();
    }
    $('#envFileInfo').hide();
    showEnvTable(min);
    findNextLevelOneScan(min);
    loadInteSumList();

    let scanRef = window.localStorage.getItem('scan');
    if(scanRef) {
        // console.log(scanRef);
        $('#scanID').val(scanRef);
        $('#request').click();
        localStorage.clear();
    }

    let fileName = $('#fileName').val();
    let apix = fileName.substr(fileName.lastIndexOf('.'), fileName.length);
    if(apix === '.txt') {
        $('#rt-sum_panel').hide();

        axios.get('/scanlevel', {
            params: {
                projectDir: document.getElementById("projectDir").value,
                scanID: min
            }
        }).then(function(response) {
            if (response === "1") {
                loadPeakList1(min, null);
                $('#scanLevelTwo').hide();
            }
            else {
                $('#scanLevelOne').hide();
                //loadPeakList2(min, )
                getRelatedScan2(min);
            }
        }).catch(function(error){
            console.log(error);
        });
    }
});