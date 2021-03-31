$( document ).ready(function() {
    console.log( "ready!" );
    let publicValue = $('#publicValue').val() === 'true';
    let name = $('#oriName').val();
    let description = $('#oriDescription').val();
    $('#public').prop("checked", publicValue);
    $('#name').val(name);
    $('#description').val(description);

    $('#editButton').click(function () {
        var result = confirm("Are you sure that you want to edit this project?");
        let publicStatus = $('#public').prop("checked") === true;
        if (result) {
            $.ajax({
                url:"editManage?type=" + document.getElementById('type').value + "&id=" + $('#id').val() + '&name=' + $('#name').val()  + '&description=' + $('#description').val() + "&publicStatus=" + publicStatus,
                type: "post",
                success: function (res) {
                    // alert('Your project has been edited.');
                    window.location.href = '/projectTab';
                }
            });
        }
    });
});