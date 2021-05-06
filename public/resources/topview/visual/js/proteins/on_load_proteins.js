/**
 * This function waits till all the HTML tags are loaded.
 * Loads the related proteins.js data file
 */
 $(document).ready(function(){
	// Gets the information of the browser. Only google gives the information in the variable.
	// Check if it is "Google". If not, alert to use Google chrome. 
	var vendor = navigator.vendor.split(" ")[0];
	if(vendor.trim() != "Google")
	{
		alert("Looks like you are not using Chrome, this application supports only Chrome");
	}
  $(".card-row").css('display','none');
  var x = location.href;
  
  // get the folder path by splitting url with "?","=","#"
  var l_split = x.split(/[?#]+/);
  if(l_split.length != 2)
  {
	$(".card-row").css('display','block');
	$(".card").hover(function() {
		$(this).css('cursor','pointer');
	});
	$(".card-body").click(function(){
		let folder = $(this).attr("id");
		let url = "proteins.html?folder=../../"+folder+"/data_js";
		window.open(url, "_self");
	})
  }
  else{
	let folderName = l_split[1].split("=")[1];
	let finalPath = folderName;
	var head= document.getElementsByTagName('head')[0];
	var script= document.createElement('script');
	var file_name = finalPath+"/proteins.js";
	script.type= 'text/javascript';
	script.src= file_name;
	head.appendChild(script);
	// Wait till the data is loaded from proteins.js and start executing the code
	script.onload = function () {
		// Function builds the complete HTML
		allProteins(folderName);
	}
  }
  
})