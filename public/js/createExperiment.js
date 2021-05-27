$( document ).ready(function() {
    console.log( "ready!" );

    $('#createButton').click(function () {
        let public = $('#public').prop("checked") === true;
        var result = confirm("Are you sure that you want to create this experiment?");
        if (result) {
            $.ajax({
                url:"newExperiment?ename=" + $('#experiment_Name').val() + "&pid=" + $('#selectProject').val() + "&description=" + $('#description').val() + "&public="+ public,
                type: "post",
                success: function (res) {
                    alert('Your experiment has been created.');
                    window.location.href = '/projectTab';
                }
            });
        }
    });
});