$(function() {
    /* database file upload */
    var dbSelected = false;
    $("#dbprogress").hide();
    $('#dbfile').fileupload({
        url: "upload",
        maxFileSize: 1000000000,
        dataType: 'json',
        // formData: {database: ''},
        add: function (e, data) {
            //data.formData={database:''};
            var format = "none";
            var fileName = data.files[0].name;
            /* Find file format */
            var index = fileName.lastIndexOf(".");
            if (index > 0) {
                format = fileName.substring(index + 1);
                format = format.toLowerCase();
            }

            // $("#upload-db-file").val("");
            $("#dbfilename").html(data.files[0].name);
            $("#dbtd").css('width', '300pt');
            $("#dbprogress").show();
            $("#dbbar").css('width', 0 + '%');
            /*data.context = $('<button class="btn btn-primary"/>').text('Upload')
                .click(function () {
                    $(this).hide();
                    data.submit();
                });
            $("#dbbutton").html(data.context);*/
            $("#uploadbutton").on("click", function () {
                data.submit();
            })
            dbSelected = true;
        },

        done: function (e, data) {
            if (dbSelected) {
                $('#debug').append('completed');
                $("#dbprogress").hide();
                $("#dbtd").css('width', '0pt');
                $("#dbfilename").html(data.result[0].name);
                $("#upload-db-file").val(data.result[0].name);
                data.context = $('<button class="btn btn-danger"/>').text('Delete')
                    .appendTo($("#dbbutton"))
                    .click(function () {
                        $(this).hide();
                        $("#dbfilename").html("");
                        $("#upload-db-file").val("");
                        $("#dbbar").css('width', 0 + "%");
                        dbSelected = false;
                    });
            }
            alert(data.result);
        },

        progressall: function (e, data) {
            var progress = parseInt(data.loaded / data.total * 100, 10);
            /*$('#debug').append('uploading');
            $('#debug').append(progress);*/
            $("#dbbar").css('width', progress + '%');
            $("#dbbar").html(progress + '%');
        }
    });
});