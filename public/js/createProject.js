$( document ).ready(function() {
    console.log( "ready!" );

    $('#createButton').click(function () {
        var result = confirm("Are you sure that you want to create this project?");
        if (result) {
            let permission = $('#permission').val();
            let password;
            if ($('#password1').val() === $('#password2').val()) {
                password = $('#password1').val();
            } else {
                alert("Password doesn't match, please check it again!");
            }
            $.ajax({
                url:"newProject?projectName=" + $('#project_Name').val() + "&projectDescription=" + $('#projectDescription').val() + "&permission=" + permission + "&password=" + password,
                type: "post",
                success: function (res) {
                    alert('Your project has been created.');
                    window.location.href = '/projectTab';
                }
            });
        }
    });

    $('#permission').change(function () {
        // console.log(this.value);
        if(this.value === '2') {
            $('#password').show();
        } else {
            $('#password').hide();
            $('#password1').val('');
            $('#password2').val('');
        }
    })
});