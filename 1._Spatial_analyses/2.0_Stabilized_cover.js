////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////// GOALS: Script to generate and stabilize annual land cover basemaps from a MapBiomas collection (eg. col 6.0)///////
//////////  Created by: Felipe Lenti, Barbara Zimbres ////////////////////////////////////////////////////////////////////////
//////////  Developed by: IPAM, SEEG and Climate Observatory ////////////////////////////////////////////////////////////////
/////////  Processing time <2h> in Google Earth Engine ////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// Processing time >86 hours in Google Earth Engine
//// Processing time 5-7h each task



// @. UPDATE HISTORIC EXECUTABLE//
// 1: Script to generate and stabilize annual land cover basemaps from a MapBiomas collection
// 1.1: Create your ImageCollection (eg. 2_1_Mask_stable)
// 1.2: Load Asset
// 1.3: Calculate frequency (number of years) in which each i_pixel was a determined class_n
// 1.4: Build the stabilized cover map for year t      
// 1.5: Class frequency window between t0 and t
// 1.6: Export data
// @. ~~~~~~~~~~~~~~ // 


/* @. Set user parameters */// eg.

// Set directory for the output file
var dir_output = 'projects/ee-seeg-br-c9/assets/v1/2_1_Mask_stable/';

// Load Asset from MapBiomas collection 6.0  
var mapbioDir = 'projects/mapbiomas-workspace/public/collection6/mapbiomas_collection60_integration_v1';
var mapbiomas = ee.Image(mapbioDir)

// Feature of the region of interest, in this case, all biomes in Brazil
var assetRegions = "projects/ee-seeg-br-c9/assets/aux/Biomes_BR";
var regions = ee.FeatureCollection(assetRegions);

// Load the filtered deforestation and regeneration masks
var regenDir = 'projects/ee-seeg-br-c9/assets/v1/1_1_Temporal_filter_deforestation';
var regen = ee.Image(regenDir);
print("bandas regen", regen.bandNames());// regeneration since 1990

var annualDesm = 'projects/ee-seeg-br-c9/assets/v1/1_1_Temporal_filter_deforestation';
var annualLoss = ee.Image(annualDesm); // deforestation since 1990
print("bandas annualLoss", annualLoss.bandNames());

// Selects bands from the MapBiomas collection starting in 1989 (makes up the pair from the 1989-1990 transition, which will be the first to be considered)
var bandNames = mapbiomas.bandNames().slice(4);
print("bandas", bandNames);
      mapbiomas = mapbiomas.select(bandNames);

// 1989 -> 2020
//////// Calculate the frequency (number of years) in which each i_pixel was a determined class_n
// General rule (ratio of the total number of years of the considered period)
var exp = '100*((b(0)+b(1)+b(2)+b(3)+b(4)+b(5)+b(6)+b(7)+b(8)+b(9)+b(10)+b(11)+b(12)+b(13)+b(14)+b(15)' +
    '+b(16)+b(17)+b(18)+b(19)+b(20)+b(21)+b(22)+b(23)+b(24)+b(25)+b(26)+b(27)+b(28)+b(29)+b(30)+b(31))/32)'; // Each collection adds one more year and it is important to check the period of the Mapbiomas collection being used

// Get frequency of each class
var florFreq = mapbiomas.eq(3).expression(exp);                     //  Forest Formation
var savFreq = mapbiomas.eq(4).expression(exp);                      // Savanna Formation
var WrestFreq = mapbiomas.eq(49).expression(exp);                   /// Wooded Restinga
var manFreq = mapbiomas.eq(5).expression(exp);                      /// Mangrove
var umiFreq = mapbiomas.eq(11).expression(exp);                     /// Wetlands
var grassFreq = mapbiomas.eq(12).expression(exp);                   // Grassland
var naoFlorFreq = mapbiomas.eq(13).expression(exp);                 // Other non Forest Formations

var silviFreq = mapbiomas.eq(9).expression(exp);                    // Forest Plantation
var pastFreq = mapbiomas.eq(15).expression(exp);                    // Pasture
var agroAnnFreq = mapbiomas.eq(19).expression(exp);                 // Temporary Crop
var canaFreq = mapbiomas.eq(20).expression(exp);                    // Sugar cane
var agroFreq = mapbiomas.eq(21).expression(exp);                    // Mosaic of Agriculture and Pasture
var praiasFreq = mapbiomas.eq(23).expression(exp);                  // Beach, Dune, and Sand
var urbanFreq = mapbiomas.eq(24).expression(exp);                   // Urban Area
var naoVegFreq = mapbiomas.eq(25).expression(exp);                  // Other non Vegetaded Areas
var rockFreq = mapbiomas.eq(29).expression(exp);                    // Rocky Outcrop
var mineFreq = mapbiomas.eq(30).expression(exp);                    // Mining
var aquiFreq = mapbiomas.eq(31).expression(exp);                    // Aquaculture
var aguaFreq = mapbiomas.eq(33).expression(exp);                    // River, Lake, and Ocean
var agroPerFreq = mapbiomas.eq(36).expression(exp);                 // Perennial Crop
var agroSojaFreq = mapbiomas.eq(39).expression(exp);                // Soybean
var agroTempRice = mapbiomas.eq(40).expression(exp);                // Rice
var agroTempFreq = mapbiomas.eq(41).expression(exp);                // Other temporary Crops
var agroPerFreqCoffee = mapbiomas.eq(46).expression(exp);           // Coffee
var agroPerFreqCitrus = mapbiomas.eq(47).expression(exp);           // Citrus
var agroPerFreqOther = mapbiomas.eq(48).expression(exp);            // Other Perennial Crops

////// Mask of stable (freq >95%) native vegetation and water
var vegMask = ee.Image(0).clip(regions)
                         .where(florFreq.gt(95), 1)  
                         .where(savFreq.gt(95), 1)
                         .where(WrestFreq.gt(95), 1) 
                         .where(manFreq.gt(95), 1)
                         .where(umiFreq.gt(95), 1)
                         .where(grassFreq.gt(95), 1)
                         .where(naoFlorFreq.gt(95), 1)
                         .where(aguaFreq.gt(95), 1);

////// Mask of stable (freq >99%) anthropic land use and rocky outcrop                
var usoMask = ee.Image(0).clip(regions)                         
                          .where(silviFreq.gt(99), 1) 
                          .where(pastFreq.gt(99), 1)  
                          .where(agroAnnFreq.gt(99), 1) 
                          .where(agroPerFreq.gt(99), 1) 
                          .where(agroPerFreqCoffee.gt(99), 1)     
                          .where(agroPerFreqCitrus.gt(99), 1)     
                          .where(agroPerFreqOther.gt(99), 1)      
                          .where(agroSojaFreq.gt(99), 1)          
                          .where(agroTempFreq.gt(99), 1)          
                          .where(canaFreq.gt(99), 1)              
                          .where(agroTempRice.gt(99), 1)                
                          .where(agroFreq.gt(99), 1)              
                          .where(praiasFreq.gt(99), 1)            
                          .where(urbanFreq.gt(99), 1)             
                          .where(naoVegFreq.gt(99), 1)            
                          .where(mineFreq.gt(99), 1)              
                          .where(aquiFreq.gt(99), 1)              
                          .where(rockFreq.gt(0), 0);  

/////Base map: 
var  baseMap = ee.Image(0).clip(regions)

///Allocate most frequent class to the land use mask in the base map
// Here the order matters, the sorting is hierarchical
                              .where(usoMask.eq(1), 21) //eg. class 21 lowest level in the hierarchy
                              .where(usoMask.eq(1).and(silviFreq.gt(99)), 9) 
                              .where(usoMask.eq(1).and(pastFreq.gt(99)), 15) 
                              .where(usoMask.eq(1).and(agroAnnFreq.gt(99)), 19) 
                              .where(usoMask.eq(1).and(agroPerFreqCoffee.gt(99)), 46) 
                              .where(usoMask.eq(1).and(agroPerFreqCitrus.gt(99)), 47) 
                              .where(usoMask.eq(1).and(agroPerFreqOther.gt(99)), 48)  
                              .where(usoMask.eq(1).and(agroPerFreq.gt(99)), 36) 
                              .where(usoMask.eq(1).and(agroSojaFreq.gt(99)), 39)
                              .where(usoMask.eq(1).and(agroTempFreq.gt(99)), 41)
                              .where(usoMask.eq(1).and(agroTempRice.gt(99)), 40)          
                              .where(usoMask.eq(1).and(canaFreq.gt(99)), 20)
                              .where(usoMask.eq(1).and(praiasFreq.gt(99)), 23)
                              .where(usoMask.eq(1).and(urbanFreq.gt(99)), 24)
                              .where(usoMask.eq(1).and(naoVegFreq.gt(99)), 25)
                              .where(usoMask.eq(1).and(mineFreq.gt(99)), 30)
                              .where(usoMask.eq(1).and(aquiFreq.gt(99)), 31)
                              .where(usoMask.eq(1).and(rockFreq.gt(0)), 29)                               
                        
//  Native vegetation of higher hierarchical order                        
// Allocates most frequent class in the native vegetation mask, with a threshold cut of 60% and then overlap the stable native areas                         
                              .where(vegMask.eq(1).and(florFreq.gt(60)), 3)
                              .where(vegMask.eq(1).and(savFreq.gt(60)), 4)
                              .where(vegMask.eq(1).and(WrestFreq.gt(60)), 49) 
                              .where(vegMask.eq(1).and(manFreq.gt(60)), 5)
                              .where(vegMask.eq(1).and(umiFreq.gt(60)), 11)
                              .where(vegMask.eq(1).and(grassFreq.gt(60)), 12)
                              .where(vegMask.eq(1).and(naoFlorFreq.gt(60)), 13)
                              .where(vegMask.eq(1).and(aguaFreq.gt(95)), 33)
                              
                              .where(vegMask.eq(1).and(florFreq.gt(95)), 3) 
                              .where(vegMask.eq(1).and(savFreq.gt(95)), 4)
                              .where(vegMask.eq(1).and(WrestFreq.gt(95)), 49) 
                              .where(vegMask.eq(1).and(manFreq.gt(95)), 5)
                              .where(vegMask.eq(1).and(umiFreq.gt(95)), 11)
                              .where(vegMask.eq(1).and(grassFreq.gt(95)), 12)
                              .where(vegMask.eq(1).and(naoFlorFreq.gt(95)), 13);
                                     
// To fill voids: 1989 map (except class 21)
// Mask Native vegetation in 1989
  var mapBiomas89vegMask = mapbiomas.select("classification_1989").remap([3, 4, 5, 49, 11, 12, 13], [1, 1, 1, 1, 1, 1, 1], 0);
// Mask Land Use and Water in 1989
  var mapBiomas89UsoMask = mapbiomas.select("classification_1989").remap([9, 15, 20, 23, 24, 25, 30, 31,  39, 40, 41, 46, 47, 48], 
                                                                         [1,  1,  1,  1,  1,  1,  1,  1,   1,  1,  1,  1,  1,  1], 0);
// 
// Merge                                                    
  var mapBiomas89Mask = mapBiomas89vegMask.where(mapBiomas89vegMask.eq(0), mapBiomas89UsoMask);

// Fills in the unstable areas with the land use and native vegetation masks in 1989
  baseMap = baseMap.where(baseMap.eq(0).and(mapBiomas89Mask.eq(1)),
                                            mapbiomas.select("classification_1989"));
  baseMap = baseMap.updateMask(baseMap.neq(0));
  baseMap = baseMap.select([0], ["classification_1989"]).unmask(0);

var years = [
    1990, 1991, 1992, 1993, 1994, 1995, 1996,
    1997, 1998, 1999, 2000, 2001, 2002, 2003,
    2004, 2005, 2006, 2007, 2008, 2009, 2010,
    2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020
]; 
var eeYears = ee.List(years);


///// Create rule for stabilizing land cover maps and generating a classification for secondary native vegetation (*100)
var goSEEG1_1 = function (element, accumList) {
  // Asset previously generated elements into the function
  annualLoss = annualLoss.unmask(0); 
  mapbiomas = mapbiomas.unmask(0);
  baseMap = baseMap.unmask(0);
  usoMask = usoMask.unmask(0);
  bandNames;

/// Map of deforestation in year t
  var thisYearLossMap =  annualLoss.select(eeYears.indexOf(element));

/// Map of regeneration in year t
  var thisYearGainMap = regen.select(eeYears.indexOf(element));

/// MapBiomas cover in year t  
  var presentBand = bandNames.get(eeYears.indexOf(element).add(1));
      presentBand = ee.List([presentBand]);
  var presentMapBio = mapbiomas.select(presentBand);

// MapBiomas cover in year t-1 
  var previous = ee.List(accumList).get(-1);
      previous = ee.Image(previous);
  
/// Other band names to be used (necessary for some step in the function)
////// Map SEEG t-1
  var lastYearMap = previous.slice(-1);

//////MapBiomas t  
  var currentMapBioBand = bandNames.get(eeYears.indexOf(element).add(1));
      currentMapBioBand = ee.List([currentMapBioBand]);
//////MapBiomas t-1      
  var lastMapBioBand = bandNames.get(eeYears.indexOf(element));
      lastMapBioBand = ee.List([lastMapBioBand]);


// Building the stabilized land cover map for year t      
///// Map in year t = map of t-1. Where deforestation (t) = 1, allocate class MapBiomas in year t
  var thisYearCoverMap = lastYearMap.where(thisYearLossMap.eq(1),
                                           mapbiomas.select(currentMapBioBand));
///// Where regeneration (t) = 1, allocate MapBiomas class in year t and multiply by 100
      thisYearCoverMap = thisYearCoverMap.where(thisYearGainMap.eq(1),
                                           mapbiomas.select(currentMapBioBand)
                                           .multiply(100));
//// Where there are classes 30 (Mining) or 24 (Urban area) in MapBiomas in year t (except 21), allocate in map year t                                 
      thisYearCoverMap = thisYearCoverMap.where(mapbiomas.select(currentMapBioBand).eq(24)
                                                .or(mapbiomas.select(currentMapBioBand).eq(30)),
                                                mapbiomas.select(currentMapBioBand));

//This year anthropic land-use Mask
var thisYearLandUseMask = thisYearCoverMap.remap([9, 15, 20, 23, 24, 25, 30, 31,  39, 40, 41, 46, 47, 48],
                                                 [1,  1,  1,  1,  1,  1,  1,  1,   1,  1,  1,  1,  1,  1], 0);


//// Release transitions between land use classes (returns land use classes from the MapBiomas map in the year considered)                            
    thisYearCoverMap = thisYearCoverMap.where(thisYearLandUseMask.eq(1).and(mapbiomas.select(currentMapBioBand).eq(9)
                                                .or(mapbiomas.select(currentMapBioBand).eq(15))
                                                .or(mapbiomas.select(currentMapBioBand).eq(20))
                                                .or(mapbiomas.select(currentMapBioBand).eq(23))
                                                .or(mapbiomas.select(currentMapBioBand).eq(24))
                                                .or(mapbiomas.select(currentMapBioBand).eq(25))
                                                .or(mapbiomas.select(currentMapBioBand).eq(30))
                                                .or(mapbiomas.select(currentMapBioBand).eq(31))
                                                .or(mapbiomas.select(currentMapBioBand).eq(39))
                                                .or(mapbiomas.select(currentMapBioBand).eq(40))
                                                .or(mapbiomas.select(currentMapBioBand).eq(41))
                                                .or(mapbiomas.select(currentMapBioBand).eq(46))
                                                .or(mapbiomas.select(currentMapBioBand).eq(47))
                                                .or(mapbiomas.select(currentMapBioBand).eq(48))),
                                                mapbiomas.select(currentMapBioBand));
      
      thisYearCoverMap = thisYearCoverMap.select([0], currentMapBioBand);

/// Bands of past years to fill maps between 1986 and t-1, based on regeneration and deforestation data and Mapbiomas  
  var pastBandsVoid = ee.Algorithms.If(ee.Number(eeYears.indexOf(element)).eq(0),
    previous.bandNames().get(0),
    previous.bandNames());
    
    pastBandsVoid = ee.List([pastBandsVoid]).flatten();

/// MapBiomas maps to be used  
/// Constant (stable classes)
  var pastConstMapBio = ee.Algorithms.If(ee.Number(eeYears.indexOf(element)).eq(0),
    mapbiomas.select(lastMapBioBand, ee.List(["classification_1989"])),
    mapbiomas.select(ee.List.repeat(ee.String(lastMapBioBand.get(0)), eeYears.indexOf(element).add(1)),
                     bandNames.slice(0, eeYears.indexOf(element).add(1))));
  pastConstMapBio = ee.Image(pastConstMapBio);

///// 
  var pastFreeMapBio = ee.Algorithms.If(ee.Number(eeYears.indexOf(element)).eq(0),
    mapbiomas.select(["classification_1989"]),
    mapbiomas.select(pastBandsVoid));
    
  pastFreeMapBio = ee.Image(pastFreeMapBio);
  
////// Class frequency window between t0 AND t
var florFreq = pastFreeMapBio.eq(3).reduce(ee.Reducer.sum()) //OK
var savFreq = pastFreeMapBio.eq(4).reduce(ee.Reducer.sum()) //OK
var WrestFreq = pastFreeMapBio.eq(49).reduce(ee.Reducer.sum()) //OK
var manFreq = pastFreeMapBio.eq(5).reduce(ee.Reducer.sum()) //OK
var umiFreq = pastFreeMapBio.eq(11).reduce(ee.Reducer.sum()) //OK
var grassFreq = pastFreeMapBio.eq(12).reduce(ee.Reducer.sum()) //OK
var naoFlorFreq = pastFreeMapBio.eq(13).reduce(ee.Reducer.sum()) //OK
        
var silviFreq = pastFreeMapBio.eq(9).reduce(ee.Reducer.sum()) //OK
var pastFreq = pastFreeMapBio.eq(15).reduce(ee.Reducer.sum()) //OK
var canaFreq = pastFreeMapBio.eq(20).reduce(ee.Reducer.sum()) //OK
var praiasFreq = pastFreeMapBio.eq(23).reduce(ee.Reducer.sum()) //OK
var urbanFreq = pastFreeMapBio.eq(24).reduce(ee.Reducer.sum()) //OK
var naoVegFreq = pastFreeMapBio.eq(25).reduce(ee.Reducer.sum()) //OK
var mineFreq = pastFreeMapBio.eq(30).reduce(ee.Reducer.sum()) //OK
var aquiFreq = pastFreeMapBio.eq(31).reduce(ee.Reducer.sum()) //OK
var agroSojaFreq = pastFreeMapBio.eq(39).reduce(ee.Reducer.sum()) //OK
var agroTempRice = pastFreeMapBio.eq(40).reduce(ee.Reducer.sum()) //OK
var agroTempFreq = pastFreeMapBio.eq(41).reduce(ee.Reducer.sum()) //OK
var agroPerFreqCoffee = pastFreeMapBio.eq(46).reduce(ee.Reducer.sum()) //OK
var agroPerFreqCitrus = pastFreeMapBio.eq(47).reduce(ee.Reducer.sum()) //OK
var agroPerFreqOther = pastFreeMapBio.eq(48).reduce(ee.Reducer.sum()) //OK


var frequencyWindow = florFreq.addBands(savFreq).addBands(WrestFreq).addBands(manFreq).addBands(umiFreq).addBands(grassFreq)
                              .addBands(naoFlorFreq).addBands(silviFreq).addBands(pastFreq).addBands(canaFreq)
                              .addBands(praiasFreq).addBands(urbanFreq).addBands(naoVegFreq).addBands(mineFreq)
                              .addBands(aquiFreq).addBands(agroSojaFreq).addBands(agroTempRice).addBands(agroTempFreq)
                              .addBands(agroPerFreqCoffee).addBands(agroPerFreqCitrus).addBands(agroPerFreqOther);
                              
var moreFrequent = ee.Algorithms.If(frequencyWindow.reduce(ee.Reducer.max())
                                                    .eq(0), mapbiomas.select(currentMapBioBand),
                    ee.Algorithms.If(frequencyWindow.reduce(ee.Reducer.max())
                                                    .eq(frequencyWindow.select(0)), ee.Image(3),
                    ee.Algorithms.If(frequencyWindow.reduce(ee.Reducer.max())
                                                    .eq(frequencyWindow.select(1)), ee.Image(4),
                     ee.Algorithms.If(frequencyWindow.reduce(ee.Reducer.max())
                                                     .eq(frequencyWindow.select(2)), ee.Image(49),
                       ee.Algorithms.If(frequencyWindow.reduce(ee.Reducer.max())
                                                      .eq(frequencyWindow.select(3)), ee.Image(5),
                        ee.Algorithms.If(frequencyWindow.reduce(ee.Reducer.max())               
                                                       .eq(frequencyWindow.select(4)), ee.Image(11) ,
                         ee.Algorithms.If(frequencyWindow.reduce(ee.Reducer.max())
                                                         .eq(frequencyWindow.select(5)), ee.Image(12) ,
                           ee.Algorithms.If(frequencyWindow.reduce(ee.Reducer.max())
                                                           .eq(frequencyWindow.select(6)), ee.Image(13) ,
                             ee.Algorithms.If(frequencyWindow.reduce(ee.Reducer.max())
                                                             .eq(frequencyWindow.select(7)), ee.Image(9) ,
                               ee.Algorithms.If(frequencyWindow.reduce(ee.Reducer.max())
                                                               .eq(frequencyWindow.select(8)), ee.Image(15) ,
                                ee.Algorithms.If(frequencyWindow.reduce(ee.Reducer.max())
                                                               .eq(frequencyWindow.select(9)), ee.Image(20) ,
                                 ee.Algorithms.If(frequencyWindow.reduce(ee.Reducer.max())
                                                                 .eq(frequencyWindow.select(10)), ee.Image(23) ,
                                     ee.Algorithms.If(frequencyWindow.reduce(ee.Reducer.max())
                                                                     .eq(frequencyWindow.select(11)), ee.Image(24) ,
                                       ee.Algorithms.If(frequencyWindow.reduce(ee.Reducer.max())
                                                                       .eq(frequencyWindow.select(12)), ee.Image(25) ,
                                         ee.Algorithms.If(frequencyWindow.reduce(ee.Reducer.max())
                                                                         .eq(frequencyWindow.select(13)), ee.Image(30) ,
                                           ee.Algorithms.If(frequencyWindow.reduce(ee.Reducer.max())
                                                                           .eq(frequencyWindow.select(14)), ee.Image(31) ,
                                             ee.Algorithms.If(frequencyWindow.reduce(ee.Reducer.max())
                                                                             .eq(frequencyWindow.select(15)), ee.Image(39) ,
                                               ee.Algorithms.If(frequencyWindow.reduce(ee.Reducer.max())
                                                                                .eq(frequencyWindow.select(16)), ee.Image(40) ,
                                                 ee.Algorithms.If(frequencyWindow.reduce(ee.Reducer.max())
                                                                                  .eq(frequencyWindow.select(17)), ee.Image(41) ,
                                                    ee.Algorithms.If(frequencyWindow.reduce(ee.Reducer.max())
                                                                                      .eq(frequencyWindow.select(18)), ee.Image(46) ,
                                                      ee.Algorithms.If(frequencyWindow.reduce(ee.Reducer.max())
                                                                                         .eq(frequencyWindow.select(19)), ee.Image(47) ,
                                                        ee.Algorithms.If(frequencyWindow.reduce(ee.Reducer.max())
                                                                                          .eq(frequencyWindow.select(20)), ee.Image(48) ,
                                                                                  mapbiomas.select(currentMapBioBand))
                                                )))))))))))))))))))));
    moreFrequent = ee.Image(moreFrequent);
    
var pastFreqMapBio = ee.Algorithms.If(ee.Number(eeYears.indexOf(element)).eq(0),
    ee.Image(moreFrequent.select([0], ["classification_1989"])),
    ee.Image(pastBandsVoid.iterate(function(element, accumImg){
      return ee.Image(accumImg).addBands(ee.Image(moreFrequent.select([0], [element]))).slice(1);
    },ee.Image(moreFrequent.select([0], ["classification_1989"])))));

  pastFreqMapBio = ee.Image(pastFreqMapBio);

///// Where there is deforestation (year t) and 'empty', fill previous years with vegetation class MapBiomas in t-1
  var adequatedPastMaps = previous.select(pastBandsVoid).where((thisYearLossMap.eq(1)
                                                               .and(lastYearMap.eq(0)))
                                                               ,
                                                    pastConstMapBio);
                                                    
                                                    
///// Where cross-cutting theme data occurs for the first time (year t) and was empty in the base map,
//// fill in all previous years with the original time series from MapBiomas
      adequatedPastMaps = adequatedPastMaps.select(pastBandsVoid).where((thisYearGainMap.eq(1)
                                                                        .and(lastYearMap.eq(0)))
                                                    ,pastConstMapBio);                                                                               

 ///// Where there is regeneration (year t) and 'empty', fill all previous years with land use class MapBiomas in t-1
      adequatedPastMaps = adequatedPastMaps.select(pastBandsVoid).where(
                                                (lastYearMap.eq(0)).and( 
                                                thisYearCoverMap.eq(9)
                                                .or(thisYearCoverMap.eq(15))
                                                .or(thisYearCoverMap.eq(20)) // 19
                                                .or(thisYearCoverMap.eq(24))
                                                .or(thisYearCoverMap.eq(25))
                                                .or(thisYearCoverMap.eq(30))
                                                .or(thisYearCoverMap.eq(31))
                                                .or(thisYearCoverMap.eq(39)) // 19
                                                .or(thisYearCoverMap.eq(40)) // 19
                                                .or(thisYearCoverMap.eq(41))
                                                .or(thisYearCoverMap.eq(46))
                                                .or(thisYearCoverMap.eq(47))
                                                .or(thisYearCoverMap.eq(48))),
                                                pastFreqMapBio);
                                                
//// Stable map: past 'filled in' + current year map
  var adequatedSack = adequatedPastMaps.addBands(thisYearCoverMap);                                                

return ee.List(accumList).add(ee.Image(adequatedSack));
  
};

// Apply the function over the MapBiomas collection
var mapsSEEG1_1 = eeYears.iterate(goSEEG1_1, ee.List([baseMap]));
    mapsSEEG1_1 = ee.List(mapsSEEG1_1);

var SEEGmap1_1 = ee.Image(mapsSEEG1_1.get(31));
print('SEEGmap1_1 Maps_pos_desmate*regen', SEEGmap1_1 );

///////////////////////////////////
//Export the stabilized land cover maps as an Image Collection
//(you need to create an empty Image Collection in the Asset to receive and store each image that is iteratively exported)

for (var i = 0; i < 32; i++){ //Number of years in the collection being used
  var bandName = SEEGmap1_1.bandNames().get(i);
  var image = SEEGmap1_1.select([bandName]).set('year', ee.Number(1989).add(i));
  
  Export.image.toAsset({
    "image": image.unmask(0).uint32(),
    "description": 'SEEG_c9_v1_'+ (1989+i),
    "assetId": dir_output + 'SEEG_c9_v1_'+ (1989+i), /// Enter the address and name 'project/seeg/col9/v1'of the Asset to be exported
    "scale": 30,
    "pyramidingPolicy": {
        '.default': 'mode'
    },
    "maxPixels": 1e13,
    "region": regions.geometry().bounds() // If desired, change here to the name of the desired region in Brazil
});   
  
}
