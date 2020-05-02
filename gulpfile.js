const gulp  = require('gulp'),
      babel = require('gulp-babel'),
      watch = require('gulp-watch');

gulp.task('js', function (){
    return watch('app/*.js', () => { gulp.src('app/*.js')
        .pipe(babel())
        .pipe(gulp.dest('dist/js'));
    });
});