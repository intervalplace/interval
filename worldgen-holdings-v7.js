// THE HOLDINGS, AND THE LANES THAT REACH THEM.
//
// Measured against the map this island is always compared to (RuneScape,
// 2002, drawn at about the same six pixels to the tile):
//
//                          RuneScape 2002     Tallyholm v7 (before this)
//   road / track / wall        11.6%                1.8%
//   buildings                   8.5%                1.2%
//   ploughed field              2.3%                0.06%
//   ANYTHING BUILT             22.4%                6.4%
//   separate built clumps        272                  73
//   median clump                ~a cottage        20 tiles
//
// Nearly a quarter of their land has something on it and six per cent of ours
// did. But the interesting number is the last two: they have four times as
// many built things and each one is SMALLER. A few big towns and then nothing
// is what an unpopulated map looks like. What they have between the towns is
// hamlets, single farmhouses, huts at a fork in the road.
//
// And the six-fold road gap is not because their roads are wider. It is
// topology. Every road on Tallyholm ran from a town to a town -- a minimum
// spanning tree with ten leaves. On their map you can leave Falador, fork
// three times, and arrive at one hut. A road that ends at somebody's door
// implies a person who is not on the map, and that implication is most of what
// makes a country feel lived in.
//
// So: LANES. Short tracks off the routed roads, each ending at a holding, each
// holding with its fields round it.
//
// Is this not the wallpaper problem again (see the note in worldgen-places-v7
// about eight rotating kinds)? No, and the distinction is worth keeping
// straight. A shrine, a gibbet, a stone circle each read as SOMEWHERE, so nine
// of them scattered at random makes none of them anywhere. A farmhouse reads
// as SOMEBODY, and a country is supposed to have many of those. Nobody looks
// at the fourth farm and wonders what it means; they look at it and think
// people live here. That is the whole job.
//
// The drawings are small on purpose. A holding is one family's, not a hamlet:
// four walls, a door onto the lane, a hearth, a bed, and a yard.

//   #  wall        ,  floor (an interior; registered in loneRooms)
//   f  fence       ^  hedge        p  plot (ploughed)
//   h  hearth      d  bed          e  table      q  barrel      v  shelf
//   T  tree        .  yard: reserved open ground
//   ~  nothing -- leave the country alone
//   @  where the lane meets the door (never built on)

export const HOLDINGS = [
  // a croft: one room and a kitchen garden
  {
    tag: 'croft', weight: 4,
    rows: [
      '~ppp~~',
      '~ppp~~',
      '~####~',
      '~#,h#~',
      '~#d,#~',
      '~##@#~',
    ],
  },
  // a longhouse with a yard and a byre
  {
    tag: 'steading', weight: 3,
    rows: [
      'pppp~~~~',
      'pppp~ff~',
      '~~~~~ff~',
      '#####~~~',
      '#,,,h#~~',
      '#d,,,#~~',
      '###@##~~',
    ],
  },
  // two cottages sharing a yard: the beginning of a hamlet
  {
    tag: 'hamlet', weight: 2,
    rows: [
      '~####~~####~',
      '~#,h#~~#h,#~',
      '~#d,#~~#,d#~',
      '~##@#~~#@##~',
      '~~..~~~~..~~',
      'pp........pp',
      'pp........pp',
    ],
  },
  // a shepherd's fold, up on the grass
  {
    tag: 'fold', weight: 2,
    rows: [
      '~ffffff~',
      '~f....f~',
      '~f....f~',
      '~ff..ff~',
      '~~####~~',
      '~~#,h#~~',
      '~~##@#~~',
    ],
  },
  // a barn on its own: no one lives here, the harvest does
  {
    tag: 'barn', weight: 2,
    rows: [
      'pppppp~',
      'pppppp~',
      '~~~~~~~',
      '#####~~',
      '#,,q,#~',
      '#,,,,#~',
      '###@#~~',
    ],
  },
  // a charcoal burner's clearing in the wood
  {
    tag: 'burner', weight: 2, wood: true,
    rows: [
      '~T~~~T~',
      '~~###~~',
      '~~#,#~~',
      '~~#@#~~',
      '~~~.~~~',
      '~T~~~T~',
    ],
  },
]

export const HOLDING_NAMES = [
  'Ashcroft', 'Barleyhow', 'Coldharbour', 'Downend', 'Elderfield', 'Fallowlea',
  'Greyfold', 'Hazelrigg', 'Ingleby', 'Kettlewell', 'Lambfold', 'Marlpit',
  'Netherby', 'Oatlands', 'Pikestaff', 'Quarrenden', 'Rushmere', 'Sallowmead',
  'Thistlewaite', 'Underhow', 'Vetchfield', 'Wainscot', 'Yarrowlea', 'Threapland',
  'Brackenside', 'Clayhanger', 'Dowsett', 'Eastcote', 'Fernilee', 'Gorsemoor',
  'Haverbrack', 'Iveson', 'Longcroft', 'Mickleden', 'Nettlebed', 'Ollerton',
]

// ---------------------------------------------------------------------------
// WHERE EACH ONE STANDS
// ---------------------------------------------------------------------------
// Baked, not searched. These fifty-two seats were produced once by the placer
// described above, on the frozen island (see TALLYHOLM_SEED), and then written
// down -- so that from here on they are EDITED rather than re-derived. Move a
// farm by changing two numbers and its lane follows; the founding will tell
// you if you have put it in a river.
//
// This is the whole argument for baking rather than hand-typing from scratch:
// every check this island has been put through -- clearance from towns and
// places, reachability of every drawn interior, no stall outside a wall, no
// field in a pond -- was passing when these numbers were taken, so they start
// correct and stay correct while a person moves them one at a time.
//
//   name   what the board at the end of the lane says
//   kind   which drawing above stands here
//   x, y   the CENTRE of the drawing
//   lane   the track from the door back to the road, tile by tile
export const HOLDING_SEATS = [
  { name: 'Ashcroft', kind: 'steading', x: 476, y: 220, lane: [[475,223],[474,223],[473,223],[472,223],[471,223],[471,222]] },
  { name: 'Barleyhow', kind: 'fold', x: 443, y: 220, lane: [[443,223],[443,222],[443,221],[443,220],[443,219],[443,218],[443,217],[443,216],[443,215],[443,214],[443,213],[443,212],[444,212],[444,211],[445,211],[445,210],[446,210],[446,209],[447,209]] },
  { name: 'Coldharbour', kind: 'fold', x: 416, y: 218, lane: [[416,221],[416,220],[416,219],[416,218],[416,217],[416,216],[416,215],[416,214],[416,213],[416,212],[416,211],[416,210],[415,210],[415,209]] },
  { name: 'Downend', kind: 'barn', x: 393, y: 214, lane: [[393,217],[393,216],[393,215],[393,214],[393,213],[393,212],[393,211],[393,210],[393,209],[393,208],[393,207],[393,206],[393,205],[394,205],[394,204],[395,204]] },
  { name: 'Elderfield', kind: 'barn', x: 349, y: 250, lane: [[349,253],[348,253],[347,253],[346,253],[345,253]] },
  { name: 'Fallowlea', kind: 'croft', x: 376, y: 283, lane: [[376,285],[376,284],[376,283],[375,283],[375,282],[374,282],[374,281],[373,281],[373,280],[372,280],[372,279],[371,279],[371,278]] },
  { name: 'Greyfold', kind: 'hamlet', x: 399, y: 262, lane: [[401,262],[400,262],[399,262],[398,262],[397,262],[396,262],[395,262],[394,262],[393,262],[392,262],[391,262],[390,262],[389,262],[388,262],[387,262],[386,262],[385,262],[384,262]] },
  { name: 'Hazelrigg', kind: 'steading', x: 509, y: 192, lane: [[508,195],[508,196],[508,197],[508,198],[508,199],[508,200],[508,201],[508,202],[508,203],[508,204],[508,205],[508,206],[508,207],[508,208],[508,209],[507,209],[507,210],[506,210]] },
  { name: 'Ingleby', kind: 'croft', x: 463, y: 155, lane: [[463,157],[464,157],[465,157],[466,157],[469,155],[469,154]] },
  { name: 'Kettlewell', kind: 'croft', x: 461, y: 132, lane: [[461,134],[460,134],[459,134],[458,134],[458,135],[457,135],[457,136]] },
  { name: 'Lambfold', kind: 'croft', x: 448, y: 111, lane: [[448,113],[447,113],[446,113],[445,113],[445,114],[444,114],[444,115],[443,115],[443,116],[442,116],[442,117],[441,117],[441,118],[440,118],[440,119]] },
  { name: 'Marlpit', kind: 'burner', x: 402, y: 96, lane: [[402,96],[403,96],[404,96],[405,96],[406,96],[407,96],[408,96]] },
  { name: 'Netherby', kind: 'steading', x: 410, y: 74, lane: [[409,77],[408,77],[407,77],[406,77],[405,77],[404,77],[403,77],[402,77],[401,77]] },
  { name: 'Oatlands', kind: 'barn', x: 542, y: 191, lane: [[542,194],[543,194],[544,194],[544,195],[545,195],[545,196],[546,196],[546,197],[547,197],[547,198],[548,198],[548,199],[549,199],[549,200],[550,200],[550,201],[551,201],[551,202],[552,202]] },
  { name: 'Pikestaff', kind: 'steading', x: 576, y: 203, lane: [[575,206],[575,205],[575,204],[575,203],[575,202],[575,201],[575,200],[575,199],[575,198],[575,197],[575,196],[574,196],[574,195],[573,195],[573,194],[572,194],[572,193],[571,193],[571,192],[570,192]] },
  { name: 'Quarrenden', kind: 'fold', x: 622, y: 181, lane: [[622,184],[622,183],[622,182],[622,181],[622,180],[622,179],[622,178],[622,177],[622,176],[622,175]] },
  { name: 'Rushmere', kind: 'croft', x: 659, y: 185, lane: [[659,187],[658,187],[658,188],[657,188],[657,189],[656,189],[656,190],[655,190]] },
  { name: 'Sallowmead', kind: 'fold', x: 703, y: 204, lane: [[703,207],[703,206],[703,205],[703,204],[703,203],[703,202],[703,201],[703,200],[703,199],[703,198]] },
  { name: 'Thistlewaite', kind: 'croft', x: 737, y: 215, lane: [[737,217],[736,217],[736,218],[735,218],[735,219],[734,219],[734,220]] },
  { name: 'Underhow', kind: 'hamlet', x: 529, y: 278, lane: [[531,278],[531,279],[531,280],[531,281],[531,282],[531,283],[530,283],[530,284],[529,284]] },
  { name: 'Vetchfield', kind: 'steading', x: 562, y: 293, lane: [[561,296],[561,297],[561,298],[561,299],[562,299]] },
  { name: 'Wainscot', kind: 'croft', x: 627, y: 293, lane: [[627,295],[627,296],[627,297],[627,298],[626,298],[626,299],[625,299],[625,300],[624,300],[624,301],[618,306],[618,307],[617,307],[617,308]] },
  { name: 'Yarrowlea', kind: 'croft', x: 613, y: 324, lane: [[613,326],[614,326],[615,326]] },
  { name: 'Threapland', kind: 'croft', x: 619, y: 345, lane: [[619,347],[620,347],[621,347],[622,347],[623,347],[624,347],[630,344],[630,343],[631,343],[631,342],[632,342],[632,341],[633,341],[633,340],[634,340],[634,339],[635,339],[635,338]] },
  { name: 'Brackenside', kind: 'steading', x: 658, y: 352, lane: [[657,355],[656,355],[655,355],[654,355],[653,355],[652,355],[651,355],[650,355],[649,355]] },
  { name: 'Clayhanger', kind: 'fold', x: 424, y: 282, lane: [[424,285],[425,285],[426,285],[427,285],[428,285],[429,285],[430,285],[431,285],[432,285],[433,285],[434,285],[435,285],[436,285],[440,285],[441,285],[441,284],[442,284],[442,283]] },
  { name: 'Dowsett', kind: 'barn', x: 451, y: 301, lane: [[451,304],[450,304],[449,304],[448,304],[447,304],[447,303],[446,303],[446,302]] },
  { name: 'Eastcote', kind: 'barn', x: 435, y: 349, lane: [[435,352],[435,351],[436,351],[436,350],[437,350],[437,349],[438,349],[438,348],[441,346],[441,345],[442,345],[442,344],[443,344],[443,343],[444,343],[444,342],[445,342],[445,341],[446,341],[446,340],[447,340]] },
  { name: 'Fernilee', kind: 'barn', x: 467, y: 353, lane: [[467,356],[466,356],[465,356],[464,356],[463,356],[463,357]] },
  { name: 'Gorsemoor', kind: 'barn', x: 463, y: 377, lane: [[463,380],[464,380],[465,380],[466,380],[467,380],[467,379],[468,379],[468,378],[469,378],[469,377]] },
  { name: 'Haverbrack', kind: 'barn', x: 595, y: 363, lane: [[595,366],[595,365],[595,364],[595,363],[595,362],[595,361],[595,360],[595,359],[595,358],[595,357]] },
  { name: 'Iveson', kind: 'barn', x: 575, y: 341, lane: [[575,344],[575,345],[575,346],[575,347],[575,348],[575,349],[575,350],[575,351],[575,352],[575,353],[575,354],[575,355],[576,355],[576,356],[577,356],[577,357],[578,357]] },
  { name: 'Longcroft', kind: 'croft', x: 565, y: 374, lane: [[565,376],[565,375],[565,374],[565,373],[564,373],[564,372],[563,372],[563,371],[562,371],[562,370]] },
  { name: 'Mickleden', kind: 'steading', x: 564, y: 395, lane: [[563,398],[562,398],[561,398],[561,397],[560,397],[560,396],[559,396],[559,395],[558,395],[558,394],[557,394],[557,393],[556,393],[556,392],[555,392],[555,391],[554,391],[554,390],[553,390],[553,389],[552,389],[552,388],[551,388],[551,387],[550,387],[550,386],[549,386]] },
  { name: 'Nettlebed', kind: 'fold', x: 532, y: 402, lane: [[532,405],[532,404],[532,403],[532,402],[532,401],[532,400],[532,399],[532,398],[532,397],[532,396]] },
  { name: 'Ollerton', kind: 'steading', x: 498, y: 395, lane: [[497,398],[497,399],[497,400],[497,401],[498,401]] },
  { name: 'Ashcroft', kind: 'croft', x: 744, y: 256, lane: [[744,258],[745,258],[746,258],[747,258],[748,258],[749,258],[750,258],[751,258],[752,258],[753,258],[754,258],[755,258],[756,258],[757,258],[758,258],[759,258],[760,258],[761,258],[762,258],[762,257]] },
  { name: 'Barleyhow', kind: 'hamlet', x: 736, y: 295, lane: [[738,295],[738,296],[738,297],[738,298],[738,299],[738,300],[737,300],[737,301],[736,301]] },
  { name: 'Coldharbour', kind: 'fold', x: 723, y: 317, lane: [[723,320],[723,319],[723,318],[723,317],[723,316],[723,315],[723,314],[723,313],[722,313],[722,312],[721,312],[721,311],[720,311],[720,310],[719,310]] },
  { name: 'Downend', kind: 'steading', x: 698, y: 318, lane: [[697,321],[698,321],[699,321],[700,321],[701,321],[702,321],[702,322],[703,322]] },
  { name: 'Elderfield', kind: 'croft', x: 692, y: 342, lane: [[692,344],[692,343],[692,342],[692,341],[692,340],[692,339],[692,338],[692,337],[692,336]] },
  { name: 'Fallowlea', kind: 'steading', x: 301, y: 288, lane: [[300,291],[300,290],[300,289],[300,288],[300,287],[301,287],[301,286],[302,286],[302,285],[303,285],[303,284],[304,284],[304,283],[305,283],[305,282],[306,282],[306,281],[307,281],[307,280],[308,280],[308,279],[309,279],[309,278],[310,278],[310,277],[311,277],[311,276],[312,276]] },
  { name: 'Greyfold', kind: 'steading', x: 294, y: 264, lane: [[293,267],[293,266],[293,265],[294,265],[294,264],[295,264],[295,263],[296,263],[296,262],[297,262],[297,261],[298,261],[298,260],[299,260]] },
  { name: 'Hazelrigg', kind: 'croft', x: 285, y: 243, lane: [[285,245],[285,246],[284,246],[284,247],[283,247],[283,248]] },
  { name: 'Ingleby', kind: 'croft', x: 264, y: 254, lane: [[264,256],[264,255],[264,254],[264,253],[264,252],[264,251],[264,250],[264,249],[264,248],[264,247],[264,246],[264,245],[265,245],[265,244],[266,244]] },
  { name: 'Kettlewell', kind: 'fold', x: 291, y: 214, lane: [[291,217],[292,217],[293,217],[294,217],[295,217],[295,218],[296,218]] },
  { name: 'Lambfold', kind: 'fold', x: 248, y: 232, lane: [[248,235],[248,236],[248,237],[249,237],[249,238],[250,238]] },
  { name: 'Marlpit', kind: 'fold', x: 342, y: 177, lane: [[342,180],[343,180],[344,180],[345,180],[346,180],[347,180],[347,179],[348,179],[348,178]] },
  { name: 'Netherby', kind: 'steading', x: 333, y: 145, lane: [[332,148],[333,148],[334,148],[335,148],[335,147],[336,147],[336,146],[337,146],[337,145],[338,145],[338,144],[339,144],[339,143],[340,143],[340,142],[341,142]] },
  { name: 'Oatlands', kind: 'steading', x: 515, y: 60, lane: [[514,63],[514,64],[514,65],[514,66],[515,66]] },
  { name: 'Pikestaff', kind: 'croft', x: 545, y: 75, lane: [[545,77],[545,76],[545,75],[546,75],[546,74],[547,74],[547,73],[548,73],[548,72],[549,72],[549,71],[550,71]] },
  { name: 'Quarrenden', kind: 'croft', x: 567, y: 85, lane: [[567,87],[567,86],[567,85],[567,84],[567,83],[567,82],[567,81],[567,80],[567,79]] },
]
