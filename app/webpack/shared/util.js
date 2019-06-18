import baseFetch from "cross-fetch";
import _ from "lodash";

// Light wrapper around fetch to ensure credentials are always passed through
const fetch = ( url, options = {} ) =>
  baseFetch( url, Object.assign( {}, options, { credentials: "same-origin" } ) );

function updateSession( params ) {
  const data = new FormData( );
  data.append( "authenticity_token", $( "meta[name=csrf-token]" ).attr( "content" ) );
  for ( const key in params ) {
    data.append( key, params[key] );
  }
  fetch( "/users/update_session", {
    method: "PUT",
    body: data
  } );
}

// Basically serialize an object so it can be used for deep object comparison,
// e.g. when deciding whether to update a react component
function objectToComparable( object = {} ) {
  return _.map( _.keys( object ).sort( ), k => {
    const v = object[k];
    if ( typeof( v ) === "object" ) {
      return `(${k}-${objectToComparable( v )})`;
    } else if ( _.isNil( v ) ) {
      return `(${k}-)`;
    }
    return `(${k}-${v})`;
  } ).sort( ).join( "," );
}

function resizeUpload( file, opts, callback ) {
  const options = opts || { };
  options.quality = options.quality || 0.9;
  const reader = new FileReader( );
  reader.onload = readerEvent => {
    const image = new Image();
    image.onload = ( ) => {
      // Resize the image
      const canvas = document.createElement( "canvas" );
      const maxDimension = 400;
      let width = image.width;
      let height = image.height;
      if ( width > height ) {
        if ( width > maxDimension ) {
          height *= maxDimension / width;
          width = maxDimension;
        }
      } else {
        if ( height > maxDimension ) {
          width *= maxDimension / height;
          height = maxDimension;
        }
      }
      canvas.width = width * 2;
      canvas.height = height * 2;
      const context = canvas.getContext( "2d" );
      context.scale( 2, 2 );
      context.drawImage( image, 0, 0, width, height );
      if ( options.blob ) {
        canvas.toBlob( callback, "image/jpeg", options.quality );
      } else {
        callback( canvas.toDataURL( "image/jpeg", options.quality ) );
      }
    };
    image.src = readerEvent.target.result;
  };
  reader.readAsDataURL( file );
}

function isBlank( val ) {
  return _.isNumber( val ) ? !_.isFinite( val ) : _.isEmpty( val );
}

function numberWithCommas( num ) {
  if ( !num && num !== 0 ) { return ""; }
  return I18n.toNumber( num, { precision: 0 } );
}

// "legacy disagreement" might be a better term here. Basically this is
// "@loarie's code determining whether this would have been considered a
// "disagreement before we introduced explicit disagreements
const addImplicitDisagreementsToActivity = activity => {
  const taxonIDsDisplayed = { };
  return activity.map( item => {
    let firstDisplay;
    if ( item.taxon && item.current ) {
      firstDisplay = !taxonIDsDisplayed[item.taxon.id];
      taxonIDsDisplayed[item.taxon.id] = true;
    } else {
      return item;
    }
    let firstIdentOfTaxon = null;
    if ( item.taxon ) {
      firstIdentOfTaxon = _.filter(
        _.sortBy(
          _.filter( activity, ai => ( ai.taxon && ai.current ) ),
          ai => ai.id
        ),
        ai => ( _.intersection( ai.taxon.ancestor_ids, [item.taxon.id] ).length > 0 )
      )[0];
    }
    let implicitDisagreement = false;
    if (
      firstIdentOfTaxon
      && item.disagreement == null
      && item.id > firstIdentOfTaxon.id
    ) {
      implicitDisagreement = true;
    }
    item.firstDisplay = firstDisplay;
    item.implicitDisagreement = implicitDisagreement;
    return item;
  } );
};

// Duplicating stylesheets/colors
const COLORS = {
  inatGreen: "#74ac00",
  inatGreenLight: "#a8cc09",
  needsIdYellow: "#FFEE91",
  needsIdYellowLight: "#85743D",
  bootstrapLinkColor: "#428BCA",
  otherLinkColor: "#337AB7",
  lightGrey: "#F7F7F7",
  borderGrey: "#DDD",
  failRed: "#D9534F",
  pageBackgroundGrey: "#f8f8f8",
  iconic: {
    Unknown: "#aaaaaa",
    Protozoa: "#691776",
    Plantae: "#73AC13",
    Fungi: "#ff1493",
    Animalia: "#1E90FF",
    Mollusca: "#FF4500",
    Arachnida: "#FF4500",
    Insecta: "#FF4500",
    Amphibia: "#1E90FF",
    Reptilia: "#1E90FF",
    Aves: "#1E90FF",
    Mammalia: "#1E90FF",
    Actinopterygii: "#1E90FF",
    Chromista: "#993300"
  }
};

export {
  fetch,
  updateSession,
  objectToComparable,
  resizeUpload,
  isBlank,
  numberWithCommas,
  addImplicitDisagreementsToActivity,
  COLORS
};
