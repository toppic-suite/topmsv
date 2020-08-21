$( document ).ready(function() {
    console.log( "ready!" );

    $('#createButton').click(function () {
        var result = confirm("Are you sure that you want to create this experiment?");
        if (result) {
            $.ajax({
                url:"newProject?projectName=" + $('#project_Name').val(),
                type: "post",
                success: function (res) {
                    alert('Your experiment has been created.');
                    window.location.href = '/experimentManagement';
                }
            });
        }
    });
});