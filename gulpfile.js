const gulp = require( 'gulp' );
const os = require( 'os' );
const browserSync = require( 'browser-sync' ).create();
const $ = require( 'gulp-load-plugins' )( { camelize: true } );
const del = require( 'del' );
const runSequence = require( 'run-sequence' ).use( gulp );
const pngquant = require( 'imagemin-pngquant' );
const Hexo = require( 'hexo' );
const hexo = new Hexo( process.cwd(), {} );

const themeRoot = './themes/skeleton';
const destRoot = `${ themeRoot }/source/assets`;

const browser = os.platform() === 'linux' ? 'google-chrome' : (
	os.platform() === 'darwin' ? 'Google Chrome' : (
	os.platform() === 'win32' ? 'chrome' : 'firefox')
);

const options = {
	paths: {
		imgSrc: `${ themeRoot }/images`,
		imgDest: `${ destRoot }/images`,
		tmp: '.tmp'
	},
	imgOptimalization: {
		optimizationLevel: 3,
		progressive: true,
		interlaced: true
	},
	open: {
		uri: 'http://localhost:4000',
		app: browser
	}
};

const svgSpritesConfig = {
	shape: {
		spacing: {
			padding: 10
		}
	},
	mode: {
		css: {
			sprite: '../images/vector.svg',
			dimensions : true,
			prefix : '.svg-',
			dest: '.',
			bust: false,
			render: {
				scss: {
					dest: `../styles/_sprites/_vectors.scss`
				}
			}
		},
		variables: {
			mapname: 'svg'
		}
	}
};

gulp.task( 'moveSprites', () => {
	return gulp.src( `${ options.paths.tmp }/*` )
		.pipe( $.cache( $.imagemin( [ pngquant() ], options.imgOptimalization ) ) )
		.pipe( gulp.dest( `${ options.paths.imgDest }` ) );
})

gulp.task( 'png-sprites', () => {
	const spritesData = gulp.src( [ `${ options.paths.imgSrc }/raster/*` ] )
		.pipe( $.sort() )
		.pipe( $.spritesmith( {
			imgName: 'raster.png',
			imgPath: '../images/raster.png',
			cssFormat: 'scss',
			cssName: '_sprites.scss'
		} ) );

	spritesData.css.pipe( gulp.dest( `${ destRoot }/styles/_sprites` ) );
	return spritesData.img.pipe( gulp.dest( `${ options.paths.tmp }` ) );
} );

gulp.task( 'svg-sprites', () => {
	return gulp.src( `${options.paths.imgSrc}/vector/*` )
		.pipe( $.sort() )
		.pipe( $.svgSprite( svgSpritesConfig ) )
		.pipe( gulp.dest( options.paths.imgDest ) );
} );

gulp.task( 'clean-public', () => del( [ destRoot ] ) );

gulp.task( 'clean-tmp', () => del( options.paths.tmp ) );

gulp.task( 'watch', () => {
	$.watch( `${ options.paths.imgSrc }/raster/**/*`, () => runSequence( 'clean-tmp', 'png-sprites', 'moveSprites', 'clean-tmp' ) )
} );

gulp.task( 'open', function() {
	gulp.src( './public/' )
		.pipe( $.open( options.open ) );
} );

gulp.task( 'hexo-server', ( cb ) => {
	hexo.init().then( () => {
		return hexo.call('server', {} );
	} ).then( () => {
		return hexo.exit();
	} ).then( () => {
		return cb()
	} ).catch( ( err ) => {
		hexo.exit( err );
		return cb( err );
	} )
} );

gulp.task( 'hexo-generate', ( cb ) => {
	hexo.init().then( () => {
		return hexo.call('generate', {} );
	} ).then( () => {
		return hexo.exit();
	} ).then( () => {
		return cb()
	} ).catch( ( err ) => {
		hexo.exit( err );
		return cb( err );
	} )
} );

gulp.task( 'server', ( cb ) => runSequence( 'clean-tmp', 'png-sprites', 'svg-sprites', 'moveSprites', 'clean-tmp', 'watch', 'hexo-server', 'open', cb ) );
gulp.task( 'generate', ( cb ) => runSequence( 'clean-tmp', 'png-sprites', 'svg-sprites', 'moveSprites', 'clean-tmp', 'hexo-generate', cb ) );
