"use strict";
/**
 * @function getAminoAcidDistribution
 * @description
 * Calculated distribution of amino-acid.
 * The first element in each amino-acid list give tha mass of the amino acid.
 * @param {Char} aminoAcid - Containd Amino Acid
 */
type AminoDist = {
  "mass":number, 
  "intensity":number
}
const getAminoAcidDistribution = function (aminoAcid: string): AminoDist[] | null{
  let aminoAcidDisList: {[key:string]:AminoDist[]} = {
    "A": [{ "mass": 71.037113784777, "intensity": 100 }, { "mass": 72.040468622587, "intensity": 3.7056470999999993 }, { "mass": 73.043823460397, "intensity": 0.2559336155115976 }, { "mass": 74.047178298207, "intensity": 0.007837690269555652 }, { "mass": 75.053455043976, "intensity": 0.00010149352253543698 }, { "mass": 76.050489937386, "intensity": 5.804534746436304e-7 }, { "mass": 77.054707019024, "intensity": 1.2638794227870654e-9 }],
    "R": [{ "mass": 156.101111023854, "intensity": 100 }, { "mass": 157.104465861664, "intensity": 8.126863400000001 }, { "mass": 158.107820699474, "intensity": 0.49795044560260393 }, { "mass": 159.111175537284, "intensity": 0.022757484865579145 }, { "mass": 160.114530375094, "intensity": 0.000677808827720204 }, { "mass": 161.117885212904, "intensity": 0.00001314421439693222 }, { "mass": 162.121240050714, "intensity": 1.7100375847958628e-7 }, { "mass": 163.125457132352, "intensity": 1.5066457084214431e-9 }],
    "N": [{ "mass": 114.04292744127, "intensity": 100 }, { "mass": 115.04628227908, "intensity": 5.2021434 }, { "mass": 116.04963711689, "intensity": 0.5215611493116611 }, { "mass": 117.0529919547, "intensity": 0.02245501836316814 }, { "mass": 118.05634679251, "intensity": 0.000876282430399337 }, { "mass": 119.062623538279, "intensity": 0.00002656204355272205 }, { "mass": 120.066840619917, "intensity": 4.79978108787108e-7 }, { "mass": 121.071057701555, "intensity": 4.905542321699711e-9 }],
    "D": [{ "mass": 115.026943023901, "intensity": 100 }, { "mass": 116.030297861711, "intensity": 4.863405099999999 }, { "mass": 117.033652699521, "intensity": 0.7106733501261888 }, { "mass": 118.037007537331, "intensity": 0.03066398776963701 }, { "mass": 119.040362375141, "intensity": 0.0018407911738404564 }, { "mass": 120.04663912091, "intensity": 0.0000660912160844368 }, { "mass": 121.050856202548, "intensity": 0.000002041053573720321 }, { "mass": 122.055073284186, "intensity": 5.198326305847819e-8 }, { "mass": 123.059290365824, "intensity": 8.047130744446261e-10 }],
    "C": [{ "mass": 103.009184786277, "intensity": 100 }, { "mass": 104.012539624087, "intensity": 4.495203899999999 }, { "mass": 105.015894461897, "intensity": 4.759347004173651 }, { "mass": 106.019249299707, "intensity": 0.18618223395261252 }, { "mass": 107.025526045476, "intensity": 0.012004351998787202 }, { "mass": 108.022560938886, "intensity": 0.00037899538467796795 }, { "mass": 109.026778020524, "intensity": 0.000005371929610922299 }, { "mass": 110.026165780524, "intensity": 3.666499745667068e-8 }, { "mass": 111.022573920224, "intensity": 1.17654586005991e-10 }],
    "Q": [{ "mass": 128.058577505412, "intensity": 100 }, { "mass": 129.061932343222, "intensity": 6.306718799999998 }, { "mass": 130.065287181032, "intensity": 0.5792728582446942 }, { "mass": 131.068642018842, "intensity": 0.028229080040894517 }, { "mass": 132.071996856652, "intensity": 0.0011256202740612799 }, { "mass": 133.075351694462, "intensity": 0.00003629748117797763 }, { "mass": 134.072386587872, "intensity": 7.755067821609428e-7 }, { "mass": 135.07660366951, "intensity": 1.0317106229019866e-8 }],
    "E": [{ "mass": 129.042593088043, "intensity": 100 }, { "mass": 130.045947925853, "intensity": 5.967980499999998 }, { "mass": 131.049302763663, "intensity": 0.7646434391270438 }, { "mass": 132.052657601473, "intensity": 0.03852608906857345 }, { "mass": 133.056012439283, "intensity": 0.002181276219259611 }, { "mass": 134.059367277093, "intensity": 0.00008650093874900171 }, { "mass": 135.063584358731, "intensity": 0.0000027756032525226355 }, { "mass": 136.063613727531, "intensity": 7.47079738870911e-8 }, { "mass": 137.067830809169, "intensity": 1.3447440987467843e-9 }],
    "G": [{ "mass": 57.021463720635, "intensity": 100 }, { "mass": 58.024818558445, "intensity": 2.6010717 }, { "mass": 59.028173396255, "intensity": 0.22695270471312612 }, { "mass": 60.034450142024, "intensity": 0.005324306606906383 }, { "mass": 61.040726887793, "intensity": 0.00004211453194317927 }, { "mass": 62.044943969431, "intensity": 1.0193302704169372e-7 }],
    "H": [{ "mass": 137.058911858639, "intensity": 100 }, { "mass": 138.062266696449, "intensity": 7.704027299999998 }, { "mass": 139.065621534259, "intensity": 0.46515172076775574 }, { "mass": 140.068976372069, "intensity": 0.0207734012778742 }, { "mass": 141.072331209879, "intensity": 0.0005889287826252297 }, { "mass": 142.075686047689, "intensity": 0.000010607388218446224 }, { "mass": 143.079040885499, "intensity": 1.2482633687877785e-7 }, { "mass": 144.083257967137, "intensity": 9.6622872716706e-10 }],
    "I": [{ "mass": 113.084063977203, "intensity": 100 }, { "mass": 114.087418815013, "intensity": 7.0193733 }, { "mass": 115.090773652823, "intensity": 0.4160815567641215 }, { "mass": 116.094128490633, "intensity": 0.017854184575875103 }, { "mass": 117.097483328443, "intensity": 0.00046251608796122484 }, { "mass": 118.100838166253, "intensity": 0.000007262269154789984 }, { "mass": 119.104193004063, "intensity": 7.05177137857875e-8 }, { "mass": 120.108410085701, "intensity": 4.1911074978107775e-10 }],
    "L": [{ "mass": 113.084063977203, "intensity": 100 }, { "mass": 114.087418815013, "intensity": 7.0193733 }, { "mass": 115.090773652823, "intensity": 0.4160815567641215 }, { "mass": 116.094128490633, "intensity": 0.017854184575875103 }, { "mass": 117.097483328443, "intensity": 0.00046251608796122484 }, { "mass": 118.100838166253, "intensity": 0.000007262269154789984 }, { "mass": 119.104193004063, "intensity": 7.05177137857875e-8 }, { "mass": 120.108410085701, "intensity": 4.1911074978107775e-10 }],
    "K": [{ "mass": 128.094963014134, "intensity": 100 }, { "mass": 129.098317851944, "intensity": 7.396204199999999 }, { "mass": 130.101672689754, "intensity": 0.44257474199815605 }, { "mass": 131.105027527564, "intensity": 0.019425057826899312 }, { "mass": 132.108382365374, "intensity": 0.0005299710000920595 }, { "mass": 133.111737203184, "intensity": 0.000009012674601070981 }, { "mass": 134.115092040994, "intensity": 9.807852640843096e-8 }, { "mass": 135.119309122632, "intensity": 6.851177821330231e-10 }],
    "M": [{ "mass": 131.040484914561, "intensity": 100 }, { "mass": 132.043839752371, "intensity": 6.704354699999998 }, { "mass": 133.047194590181, "intensity": 4.871353930562803 }, { "mass": 134.050549427991, "intensity": 0.2918998803991113 }, { "mass": 135.053904265801, "intensity": 0.016722138025555156 }, { "mass": 136.057259103611, "intensity": 0.000668101195306857 }, { "mass": 137.061476185249, "intensity": 0.000015279478139334292 }, { "mass": 138.061505554049, "intensity": 2.0414454262470327e-7 }, { "mass": 139.060893314049, "intensity": 1.6264119322645776e-9 }],
    "F": [{ "mass": 147.068413913061, "intensity": 100 }, { "mass": 148.071768750871, "intensity": 10.241089099999998 }, { "mass": 149.075123588681, "intensity": 0.6765774058845707 }, { "mass": 150.078478426491, "intensity": 0.03378899417971306 }, { "mass": 151.081833264301, "intensity": 0.0011889535064009526 }, { "mass": 152.085188102111, "intensity": 0.000028787858817174454 }, { "mass": 153.088542939921, "intensity": 4.84425106102639e-7 }, { "mass": 154.092760021559, "intensity": 5.596891526553611e-9 }],
    "P": [{ "mass": 97.052763848919, "intensity": 100 }, { "mass": 98.056118686729, "intensity": 5.891795299999997 }, { "mass": 99.059473524539, "intensity": 0.34914145263240065 }, { "mass": 100.062828362349, "intensity": 0.013887471917554104 }, { "mass": 101.066183200159, "intensity": 0.00030415394202647 }, { "mass": 102.069538037969, "intensity": 0.000003762190528608282 }, { "mass": 103.073755119607, "intensity": 2.645711700032506e-8 }, { "mass": 104.073784488407, "intensity": 1.0173120835054687e-10 }],
    "S": [{ "mass": 87.032028404339, "intensity": 100 }, { "mass": 88.035383242149, "intensity": 3.743739699999999 }, { "mass": 89.038738079959, "intensity": 0.4628445928388122 }, { "mass": 90.042092917769, "intensity": 0.015550264594595421 }, { "mass": 91.048369663538, "intensity": 0.0006304211468136977 }, { "mass": 92.045404556948, "intensity": 0.000016725521474004213 }, { "mass": 93.049621638586, "intensity": 2.1005356909225693e-7 }, { "mass": 94.053838720224, "intensity": 1.1933098522048169e-9 }],
    "T": [{ "mass": 101.047678468481, "intensity": 100 }, { "mass": 102.051033306291, "intensity": 4.8483151 }, { "mass": 103.054388144101, "intensity": 0.5044471332689556 }, { "mass": 104.057742981911, "intensity": 0.020672109981450984 }, { "mass": 105.061097819721, "intensity": 0.000803343712719545 }, { "mass": 106.06737456549, "intensity": 0.000023727975051586104 }, { "mass": 107.071591647128, "intensity": 3.96373861991128e-7 }, { "mass": 108.075808728766, "intensity": 3.5400396423855965e-9 }],
    "W": [{ "mass": 186.079312949992, "intensity": 100 }, { "mass": 187.082667787802, "intensity": 12.781065599999994 }, { "mass": 188.086022625612, "intensity": 0.9565900782717055 }, { "mass": 189.089377463422, "intensity": 0.05305598949058915 }, { "mass": 190.092732301232, "intensity": 0.0021863792835711965 }, { "mass": 191.096087139042, "intensity": 0.00006601300724950283 }, { "mass": 192.099441976852, "intensity": 0.0000014673647585474691 }, { "mass": 193.102796814662, "intensity": 2.4235376781370304e-8 }, { "mass": 194.1070138963, "intensity": 2.929078650196204e-10 }],
    "Y": [{ "mass": 163.063328532623, "intensity": 100 }, { "mass": 164.066683370433, "intensity": 10.279181699999999 }, { "mass": 165.070038208243, "intensity": 0.8859779029910774 }, { "mass": 166.073393046053, "intensity": 0.055092096758592446 }, { "mass": 167.076747883863, "intensity": 0.0025921871224262117 }, { "mass": 168.080102721673, "intensity": 0.00009867694242589899 }, { "mass": 169.083457559483, "intensity": 0.0000029386834719433493 }, { "mass": 170.087674641121, "intensity": 6.494029878666147e-8 }, { "mass": 171.091891722759, "intensity": 9.976226879919307e-10 }],
    "V": [{ "mass": 99.068413913061, "intensity": 100 }, { "mass": 100.071768750871, "intensity": 5.914797899999997 }, { "mass": 101.075123588681, "intensity": 0.3504980415370953 }, { "mass": 102.078478426491, "intensity": 0.01396786146594763 }, { "mass": 103.081833264301, "intensity": 0.0003073530400814803 }, { "mass": 104.085188102111, "intensity": 0.000003832337546618861 }, { "mass": 105.089405183749, "intensity": 2.7314984506202217e-8 }, { "mass": 106.089434552549, "intensity": 1.078617419776402e-10 }],
    "H2O": [{ "mass": 18.010564683704, "intensity": 100 }, { "mass": 19.016841429473, "intensity": 0.0610952 }, { "mass": 20.023118175242, "intensity": 0.20550948508742448 }, { "mass": 21.02733525688, "intensity": 0.000047270708872938315 }, { "mass": 22.02736462568, "intensity": 2.7183440429353995e-9 }]
  };
  if (aminoAcidDisList.hasOwnProperty(aminoAcid)) {
    return aminoAcidDisList[aminoAcid];
  }
  else {
    return null;
  }
};
