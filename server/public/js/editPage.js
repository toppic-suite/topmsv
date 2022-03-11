"use strict";
$(document).ready(function () {
    console.log("ready!");
    let publicValue = $('#publicValue').val() === 'true';
    let name = $('#oriName').val();
    let description = $('#oriDescription').val();
    if (name == undefined) {
        $('#name').val('');
    }
    else {
        $('#name').val(name);
    }
    if (description == undefined) {
        $('#description').val('');
    }
    else {
        $('#description').val(description);
    }
    $('#public').prop("checked", publicValue);
    $('#editButton').click(function () {
        let result = confirm("Are you sure that you want to edit this project?");
        let publicStatus = $('#public').prop("checked") === true;
        if (result) {
            let type = document.querySelector('#type');
            if (type) {
                $.ajax({
                    url: "editManage?type=" + type.value + "&id=" + $('#id').val() + '&name=' + $('#name').val() + '&description=' + $('#description').val() + "&publicStatus=" + publicStatus,
                    type: "post",
                    success: function (res) {
                        // alert('Your project has been edited.');
                        window.location.href = '/projectTab';
                    }
                });
            }
        }
    });
});
