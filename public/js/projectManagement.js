$( document ).ready(function() {
    console.log( "ready!" );
    let publicValue = $('#publicValue').val() === 'true';
    let projectName = $('#projectName').val();
    let description = $('#description').val();
    $('#public').prop("checked", publicValue);
    $('#project_Name').val(projectName);
    $('#project_Description').val(description);

    $('#removeProject').click(function () {
        var result = confirm("Are you sure that you want to remove this project?");
        /*if (result) {
            $.ajax({
                url:"removeProject?projectCode=" + document.getElementById('projectCode').value,
                type: "post",
                success: function (res) {
                    alert('Your project has been removed.');
                    window.location.href = '/projects';
                }
            });
        }*/
        if (result) {
            $.ajax({
                url:"checkProjectStatusSync?projectCode=" + document.getElementById('projectCode').value,
                type: "post",
                success: function (res) {
                    if (res !== 3) {//if it is not already removed
                        $.ajax({
                            url:"removeProject?projectCode=" + document.getElementById('projectCode').value,
                            type: "post",
                            success: function (res) {
                                alert('Your project has been removed.');
                                window.location.href = '/projects';
                            }
                        });
                    } else {
                        alert('ERROR: The project is already removed.');
                        window.location.href = '/projects';
                    }
                }
            });
        }
    });

    $('#editButton').click(function () {
        var result = confirm("Are you sure that you want to edit this project?");
        let publicStatus = $('#public').prop("checked") === true;
        if (result) {
            $.ajax({
                url:"editProject?projectCode=" + document.getElementById('projectCode').value + "&projectName=" + $('#project_Name').val() + '&description=' + $('#project_Description').val() + "&publicStatus=" + publicStatus,
                type: "post",
                success: function (res) {
                    alert('Your project has been edited.');
                    window.location.href = '/projects';
                }
            });
        }
    });
});