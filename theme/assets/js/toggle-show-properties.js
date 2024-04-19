function toggleProperties (itemsLength){
    console.log("function is being called")
    // Get a NodeList of all .demo elements
    const propertiesToToggle = document.querySelectorAll('.toggle-property');
    const button = document.querySelector('#all-properties-btn');
    const pagenumber = document.querySelector('.page-number');
    pagenumber.style.display = "none"
    button.style.display = "none";
    // Change the text of multiple elements with a loop
    propertiesToToggle.forEach(property => {
        if (property.style.display !== 'block'){
            property.style.display = 'block';
        } else {
            property.style.display = 'none';
        }
    });
}