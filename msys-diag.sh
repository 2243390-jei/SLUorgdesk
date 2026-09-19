# Diagnostic: how does Git Bash/MSYS rewrite arguments before a native Windows
# program sees them? `cmd //c echo` is a native program that prints its argv.
# //c is the MSYS idiom for passing /c literally.

echo "ARG1  plain path                 :"
cmd //c echo "              [/app/uploads]"
echo
echo "ARG2  flag=value with path       :"
cmd //c echo "              [volume=uploads,mount-path=/app/uploads]"
echo
echo "ARG3  doubled leading slash      :"
cmd //c echo "              [volume=uploads,mount-path=//app/uploads]"
echo
echo "ARG4  space-separated flag form  :"
cmd //c echo "              [--add-volume-mount volume=uploads,mount-path=/app/uploads]"
echo
echo "does gcloud still work with the conversion disabled globally?"
echo -n "  gcloud config get-value project  -> "
gcloud config get-value project 2>&1 | head -1
echo -n "  MSYS_NO_PATHCONV=1 gcloud ...    -> "
MSYS_NO_PATHCONV=1 gcloud config get-value project 2>&1 | head -1
