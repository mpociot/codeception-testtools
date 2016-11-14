var helper = require('./modules/helper'),
    faker = require('faker/locale/en_US'),
    $ = require('jquery'),
    hljs = require('./libs/highlight'),
    Vue = require('vue');
    Vue.config.devtools = false;
    
hljs.registerLanguage('php', require('./libs/languages/php'));

var indent = "    ";
var fakerText="";
fakerText += indent + "\/**" + "\n";
fakerText += indent + " * @var Faker\Generator" + "\n";
fakerText += indent + " *\/" + "\n";
fakerText += indent + "protected $faker;" + "\n";
fakerText += indent + "" + "\n";
fakerText += indent + "\/**" + "\n";
fakerText += indent + " * Setup faker" + "\n";
fakerText += indent + " *\/" + "\n";
fakerText += indent + "public function __construct()" + "\n";
fakerText += indent + "{" + "\n";
fakerText += indent + "    $this->faker = \\Faker\\Factory::create();" + "\n";
fakerText += indent + "}";

var App = new Vue({
    el: "body",

    data: {
        renaming: false,
        linebreak: "\n",
        indent: "        ",
        steps: [],
        message: '',
        namespace: '',
        className: 'ExampleTest',
        testName: helper.ucfirst(faker.company.catchPhraseNoun().replace('-','').replace(' ','')) + 'Is' + helper.ucfirst(faker.commerce.productAdjective().replace('-','')),
        recording: false,

        withoutMiddleware: false,
        dbMigrations: false,
        dbTransactions: false
    },

    watch: {
      'namespace': function() {
        this.updateCode();
      },

      'className': function() {
        this.updateCode();
      },

      'testName': function() {
        this.updateCode();
      },

      'withoutMiddleware': function() {
        this.updateCode();
      },

      'dbMigrations': function() {
        this.updateCode();
      },

      'dbTransactions': function() {
        this.updateCode();
      },

      'steps': function(val, oldVal) {
        this.updateCode();
      },

      'recording': function(val, oldVal) {
        _postMessage({
          'method': 'recording',
          'value': val
        });
      }
    },

    computed: {

      hasFaker: function() {
        var hasFaker = false;
        this.steps.forEach(function(step){
          if (step.faker) {
            hasFaker = true;
          }
        });
        return hasFaker;
      }
    },

    filters: {
        implode: function(val, faker) {
            var result = '';
            if (val) {
              val.forEach(function(attribute, key){
                  if (key === 0 && faker === true) {
                    result += ""+attribute+", ";
                  } else {
                    result += "'"+helper.addslashes(attribute)+"', ";
                  }
              });
              return result.slice(0,-2);
            }
            return result;
        }
    },

    methods: {
      clear: function() {
        _postMessage({
          'method': 'clear'
        });
      },

      undo: function() {
          _postMessage({
            'method': 'undo'
          });
      },

      rename: function() {
        this.renaming = ! this.renaming;
      },

      copyTest: function() {
        var self = this;
        var range = document.createRange();
        var selection = window.getSelection();
        range.selectNodeContents(document.getElementById('testcode'));
        selection.removeAllRanges();
        selection.addRange(range);

        window.document.execCommand('Copy');

        this.message = 'Test successfully copied to clipboard.';

        setTimeout(function(){
          self.message = '';
        }, 1500);
      },

      updateCode: function() {
        var self = this;
        $('#testcode').html(hljs.highlightAuto(
          $('#steps')
            .text()
            .replace('%TESTNAME%', self.testName)
            .replace('%CLASSNAME%', self.className)
            .replace('%NAMESPACE%', (self.namespace !== '') ? 'namespace ' + self.namespace + ';' + "\n" : '' )
            .replace('%FAKER%', this.hasFaker ? fakerText : '' )
          ).value
        );
      }

    }

});

window.setSteps = function(message) {
  App.steps = message.steps;
};

window.setPathname = function(pathname) {
  var className = '';

  pathname.split('/').map(function(part){
    className += helper.ucfirst(part).replace(/[^\w]/gi, '');
  });
  App.className = className + 'Test';
};
