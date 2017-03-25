### To run the application:

Please install `npm install http-server -g` and go to project directory and run
`http-server` on terminal or any CLI. Visit `http://localhost:8080/` and you should
be able to see the app. (You need to have node and npm installed on your machine)

How to install npm?
http://blog.npmjs.org/post/85484771375/how-to-install-npm

How to install http-server?
https://www.npmjs.com/package/http-server

The other alternative is to get `atom-live-server` for atom editor and run the app
that way.

How to install Atom?
https://atom.io/

How to install Atom packages?
http://flight-manual.atom.io/using-atom/sections/atom-packages/

Or just open .html file in your browser!

The app loads 5 locations (sushi restaurants) in Toronto by default. If you search
any restaurant using search bar it will ask for your location and finds the kind
of restaurant you have searched for.

The data comes from two different API calls so sometimes they don't match, like
if Zomato API returned 20 restaurants Foursquare has detail of 18 of them, in this
case you can use the name filter to filter all the locations without name.

The app is using Zomato and Foursquare API for list of restaurants and the red
information button on the top right hand of the website mentions this too.
