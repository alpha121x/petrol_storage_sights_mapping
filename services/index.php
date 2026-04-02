<!-- // add return function to index.php -->
<?php
function returnToIndex() {
    header("Location: index.php");
    exit();
}
?>
