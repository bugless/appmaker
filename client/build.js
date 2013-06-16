var fs = require("fs"),
    exec = require('child_process').exec,
    os = require('os'),
    Space = require('space'),
    wrench = require('wrench'),
    util = require('util'),
    _ = require('underscore'),
    async = require('async')


var publicPath = __dirname + '/public/'
var productionPath = __dirname + '/production/'
var appsPath = __dirname + '/apps/'
var corePath = __dirname + '/core/'
var code = {}
code.css = ''
code.js = ''
code.html = ''
var includes = {}
includes.css = ''
includes.js = ''
includes.html = ''



/*** LIB FILES ***/
var externalLibs = 'jquery-1.9.1.min.js jquery.dimensions.js Lasso.js validateEmail.js ParseQueryString.js Permalink.js jquery.scrollbar.js ToProperCase.js ParseName.js jquery.topdiv.js blinker.js Spectrum.js underscore.js marked.js natural_sort.js store.js goog.js events.js parseCookie.js MoveCursorToEnd.js socket.io.js moment.min.js jquery.sha256.min.js space.js scraps.js thumbs.js platform.js jquery.htmltoscraps.js'.split(/ /)
_.each(externalLibs, function (filename) {
  includes.js += '    <script type="text/javascript" src="/nudgepad/public/js/' + filename + '"></script>\n'
  code.js += fs.readFileSync(publicPath + 'js/' + filename, 'utf8') + ';'
})


/*** CORE FILES ***/

var jsFiles = _.without(fs.readdirSync(corePath + 'js'), '.DS_Store')
// Do some reordering
jsFiles = _.without(jsFiles, 'Nudgepad.js', 'App.js')
jsFiles.unshift('Nudgepad.js')
jsFiles.unshift('App.js')
_.each(jsFiles, function (filename) {
  includes.js += '    <script type="text/javascript" src="/nudgepad/core/js/' + filename + '"></script>\n'
  code.js += fs.readFileSync(corePath + 'js/' + filename, 'utf8') + ';'
})

var cssFiles = _.without(fs.readdirSync(corePath + 'css'), '.DS_Store')
_.each(cssFiles, function (filename) {
  includes.css += '    <link rel="stylesheet" href="/nudgepad/core/css/' + filename + '" type="text/css"/>\n'
  code.css += fs.readFileSync(corePath + 'css/' + filename, 'utf8')
})

var htmlFiles = _.without(fs.readdirSync(corePath + 'html'), '.DS_Store')
_.each(htmlFiles, function (filename) {
  code.html += fs.readFileSync(corePath + 'html/' + filename, 'utf8')
})


/*** APPS ***/

var apps = _.without(fs.readdirSync(appsPath), '.DS_Store')
_.each(apps, function (appName) {
  var appDir = appsPath + appName + '/'
  
  var settings = new Space(fs.readFileSync(appDir + 'app.space', 'utf8'))
  var files
  

  files = settings.get('css').split(/ /g)
  _.each(files, function (filename) {
    
    if (filename.match('.css')) {
      code.css += fs.readFileSync(appDir + filename, 'utf8')
      includes.css += '    <link rel="stylesheet" href="/nudgepad/apps/' + appName + '/' + filename + '" type="text/css"/>\n'
    }
    // directory
    else {
      var subfiles = _.without(fs.readdirSync(appDir + filename), '.DS_Store')
      _.each(subfiles, function (subfile) {
        code.css += fs.readFileSync(appDir + filename + '/' + subfile, 'utf8')
        includes.css += '    <link rel="stylesheet" href="/nudgepad/apps/' + appName + '/' + filename + '/' + subfile + '" type="text/css"/>\n'
      })
    }
    
  })
  
  files = settings.get('js').split(/ /g)
  _.each(files, function (filename) {
    
    if (filename.match('.js')) {
      code.js += fs.readFileSync(appDir + filename, 'utf8')
      includes.js += '    <script type="text/javascript" src="/nudgepad/apps/' + appName + '/' + filename + '"></script>\n'
    }
    // directory
    else {
      var subfiles = _.without(fs.readdirSync(appDir + filename), '.DS_Store')
      _.each(subfiles, function (subfile) {
        code.js += fs.readFileSync(appDir + filename + '/' + subfile, 'utf8')
        includes.js += '    <script type="text/javascript" src="/nudgepad/apps/' + appName + '/' + filename + '/' + subfile + '"></script>\n'
      })
    }
    
  })
  
  files = settings.get('html').split(/ /g)
  _.each(files, function (filename) {
    
    if (filename.match('.html')) {
      code.html += fs.readFileSync(appDir + filename, 'utf8')
    }
    // directory
    else {
      var subfiles = _.without(fs.readdirSync(appDir + filename), '.DS_Store')
      _.each(subfiles, function (subfile) {
        code.html += fs.readFileSync(appDir + filename + '/' + subfile, 'utf8')
      })
    }
  })
  

})

// BUILD HTML FILES
var buildHtml = function (destination, source) {
  var file = fs.readFileSync(source, 'utf8')
  file = file.replace(/\nCSSINCLUDES\n/, '\n' + includes.css + '\n')
  file = file.replace(/\nJSINCLUDES\n/, '\n' + includes.js + '\n')
  file = file.replace(/\nHTMLCOMPONENTS\n/, '\n' + code.html + '\n')
  fs.writeFileSync(destination, file, 'utf8')  
}

buildHtml(productionPath + 'nudgepad.dev.html', corePath + '/nudgepad.dev.html')


// IF they run the command like this: node build.js, just build dev
// Otherwise if they run: node build.js prod, build both
if (process.argv.length < 3) {
  process.exit()
}

// Build concatenated css file to be used for minifiy
fs.writeFileSync(productionPath + 'nudgepad.min.css', code.css, 'utf8')
// Build concatenated js file to be used for minifiy
fs.writeFileSync(productionPath + 'nudgepad.min.js', code.js, 'utf8')
// (min.css and min.js are generated by makefile)
buildHtml(productionPath + 'nudgepad.min.html', corePath + '/nudgepad.min.html')




