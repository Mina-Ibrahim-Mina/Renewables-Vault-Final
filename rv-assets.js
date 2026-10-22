/* Renewables Vault: asset profile questions and document rules, shared by the developer dashboard and the admin panel.
 * The document rules must match requiredDocs_ in the server script. */
var TYPES={
  biofuel:{label:'Biofuel & Biodiesel',icon:'fa-gas-pump',desc:'Biodiesel and biofuel plants selling to industrial buyers.'},
  circular:{label:'Circular Economy (Waste Recycling)',icon:'fa-recycle',desc:'Recycling and recovery facilities.'},
  solar:{label:'Solar C&I (Commercial & Industrial)',icon:'fa-solar-panel',desc:'Solar systems supplying businesses, factories and farms.'}
};
function typeKey(label){label=String(label||'');return /circular|recycl/i.test(label)?'circular':/solar/i.test(label)?'solar':/bio/i.test(label)?'biofuel':'';}

function O(pairs){return pairs.map(function(p){return{v:p[0],t:p[1]};});}
var SPECIFIC={
  biofuel:[
    {k:'b_cap',t:'text',q:'Production capacity',ph:'e.g. 15,000 tonnes per year',req:1},
    {k:'b_feed',t:'radio',q:'Main feedstock',req:1,o:O([['uco','Used cooking oil'],['veg','Vegetable oils'],['fat','Animal fats'],['res','Agricultural or other residues'],['mix','Mixed or other']])},
    {k:'b_prod',t:'radio',q:'Main product sold',req:1,o:O([['bd','Biodiesel (B100 or blends)'],['ind','Bio-heavy fuel or industrial fuel'],['gly','Glycerin and by-products'],['oth','Other']])}
  ],
  circular:[
    {k:'c_stream',t:'radio',q:'Main waste stream processed',req:1,o:O([['pl','Plastics (PET, HDPE, etc.)'],['pa','Paper and cardboard'],['me','Metals'],['or','Organic or food waste'],['cd','Construction and demolition waste'],['mx','Mixed municipal waste'],['ot','Other']])},
    {k:'c_cap',t:'text',q:'Processing capacity',ph:'e.g. 30,000 tonnes per year',req:1},
    {k:'c_rev',t:'radio',q:'Main source of revenue',req:1,o:O([['sale','Sale of recycled material'],['gate','Gate or tipping fees'],['svc','Collection or service contract'],['mix','A mix of these']])}
  ],
  solar:[
    {k:'s_cap',t:'text',q:'Installed capacity',ph:'e.g. 2.5 MWp',req:1},
    {k:'s_model',t:'radio',q:'Business model',req:1,o:O([['ppa','Power purchase agreement (client pays per kWh)'],['lease','Lease or rental (fixed monthly payment)'],['oth','Other']])},
    {k:'s_client',t:'radio',q:'Client sector',req:1,o:O([['ind','Industrial or factory'],['agr','Agriculture'],['com','Commercial and retail'],['hos','Hospitality'],['oth','Other']])}
  ]
};
var CONTRACT={
  biofuel:O([['fsa','Supply or offtake agreement with agreed pricing'],['ota','Framework or service contract'],['other','Spot sales, no long-term contract']]),
  circular:O([['fsa','Long-term offtake contract for recycled material'],['ota','Gate-fee or waste-service contract'],['other','Spot sales, no long-term contract']]),
  solar:O([['ppa','PPA with the client (per-kWh tariff)'],['ota','Lease or rental agreement'],['other','Other, no long-term contract']])
};
/* Documents: which uploads each step asks for, based on the answers. Must match requiredDocs_ in the server script. */
var DOC_EXT=/\.(pdf|jpe?g|png|webp|heic|docx?|xlsx?|pptx?|csv)$/i,DOC_ACCEPT='.pdf,.jpg,.jpeg,.png,.webp,.heic,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.csv',DOC_MAX=10*1024*1024,DOC_PER_SLOT=5;
function contractLabel(t){return t==='solar'?'Signed PPA or lease agreement':t==='circular'?'Signed offtake or waste service contract':'Signed supply or offtake contract';}
function docSlots(type,a,step){a=a||{};var L=[];
  if(step===0)L.push({k:'d_photos',l:'Photos of the asset or a short company presentation',h:'Optional, but it helps our team understand the asset.',req:0});
  if(step===1){
    if(a.q11&&a.q11!=='other')L.push({k:'d_contract',l:contractLabel(type),h:'The contract you described above, all pages including the signature page.',req:1});
    if(a.q15&&a.q15!=='first_year')L.push({k:'d_payments',l:'Proof of the buyer\u2019s payments for the last 12 months',h:'Invoices with the matching bank statements, or a statement of account from the buyer.',req:1});
  }
  if(step===2){
    L.push({k:'d_cr',l:'Commercial register extract and tax card',h:'A recent copy of both. You can upload them as separate files.',req:1});
    if(a.q33==='3y'||a.q33==='1y')L.push({k:'d_fs',l:'Latest audited financial statements',h:'The most recent year, including the auditor\u2019s report.',req:1});
    if(a.q52==='in_process')L.push({k:'d_lic',l:'Proof of your licence application',h:'The application receipt or the authority\u2019s acknowledgement.',req:1});
    else if(a.q52==='licensed'||a.q52==='provisional')L.push({k:'d_lic',l:'Operating licence and permits for the asset',h:'Upload each licence or permit as a file.',req:1});
    if(a.q43==='restrict')L.push({k:'d_loan',l:'Existing loan agreement or a letter from the lender',h:'Required because a lender has security over the revenue.',req:1});
    else if(a.q43==='no_restrict')L.push({k:'d_loan',l:'Existing loan agreement or a letter from the lender',h:'Optional.',req:0});
  }
  if(step===3)L.push({k:'d_val',l:'Valuation report or recent asset valuation',h:'Optional.',req:0});
  return L;}
function steps(type){return [
  {title:'The asset',desc:'Basic information about the asset you would like to finance.',qs:[
    {k:'a_name',t:'text',q:'Asset name',ph:'e.g. 10th of Ramadan Biodiesel Plant',req:1},
    {k:'a_loc',t:'text',q:'Location (city or governorate)',ph:'e.g. 10th of Ramadan City, Sharqia',req:1}
  ].concat(SPECIFIC[type]).concat([
    {k:'q21',t:'radio',q:'How long has the asset been operating?',req:1,o:O([['gt7','More than 7 years'],['3to7','3 to 7 years'],['1to3','1 to 3 years'],['lt1','Less than 1 year'],['not_yet','Not yet operating']])},
    {k:'q23',t:'radio',q:'Current output compared with full capacity',req:1,o:O([['gt80','Above 80%'],['60to80','60% to 80%'],['40to60','40% to 60%'],['lt40','Below 40%']])}
  ])},
  {title:'Revenue & contracts',desc:'How the asset earns its revenue.',qs:[
    {k:'q11',t:'radio',q:'What kind of contract does the revenue come from?',req:1,o:CONTRACT[type]},
    {k:'q12',t:'radio',q:'Who is the main buyer or client?',req:1,o:O([['gov','Government entity or public utility'],['ig_corp','Large corporate or multinational'],['local_corp','Established local or regional company'],['sme','Small business']])},
    {k:'q13',t:'radio',q:'Time remaining on the main contract',req:1,o:O([['gt5','More than 5 years'],['2to5','2 to 5 years'],['1to2','1 to 2 years'],['lt1','Less than 1 year']])},
    {k:'q15',t:'radio',q:"Buyer's payment record over the last 12 months",req:1,o:O([['perfect','Always on time'],['minor','1–2 short delays'],['first_year','Less than one year of history'],['issues','3 or more late or missed payments']])},
    {k:'q51',t:'radio',q:'Currency of the revenue',req:1,o:O([['usd','US dollars'],['usd_indexed','Egyptian pounds, indexed to USD'],['egp','Egyptian pounds'],['other','Other']])},
    {k:'q14',t:'text',q:'Approximate annual revenue from contracts (USD equivalent)',ph:'e.g. 2,400,000',req:0}
  ]},
  {title:'Company & legal',desc:'About your company and the legal position of the asset.',qs:[
    {k:'q31',t:'radio',q:'How long has your company operated in this sector?',req:1,o:O([['gt10','More than 10 years'],['5to10','5 to 10 years'],['2to5','2 to 5 years'],['lt2','Less than 2 years']])},
    {k:'q33',t:'radio',q:'Do you have audited financial statements?',req:1,o:O([['3y','Yes, 3 years or more'],['1y','Yes, 1 to 2 years'],['first_year','First year of operation'],['none','No']])},
    {k:'q52',t:'radio',q:'Licences and permits for the asset',req:1,o:O([['licensed','All licences in place'],['provisional','Provisional licence'],['in_process','Application in progress'],['dispute','Under dispute']])},
    {k:'q43',t:'radio',q:'Are there existing loans secured on the asset or its revenue?',req:1,o:O([['none','No, the asset and revenue are free of loans'],['no_restrict','Yes, but there is no security over the revenue'],['restrict','Yes, a lender has security over the revenue']])},
    {k:'q42',t:'radio',q:'Can the contract revenue be assigned to a financing partner?',req:1,o:O([['yes','Yes'],['review','Possibly, with buyer consent'],['unsure','Not sure'],['no','No, the contract does not allow it']])},
    {k:'q35',t:'radio',q:'Any legal disputes or investigations involving the asset?',req:1,o:O([['no','No'],['minor','A minor commercial dispute'],['yes','Yes, an active dispute or investigation']])}
  ]},
  {title:'Financing',desc:'What you are looking for.',qs:[
    {k:'q61',t:'text',q:'Estimated current value of the asset (USD equivalent)',ph:'e.g. 6,000,000',req:1},
    {k:'q62',t:'text',q:'Amount of capital you are seeking (USD equivalent)',ph:'e.g. 3,000,000',req:1},
    {k:'q64',t:'radio',q:'Could a company or personal guarantee be provided?',req:1,o:O([['yes','Yes'],['no','No']])},
    {k:'q66',t:'area',q:'Anything else we should know? (optional)',ph:'e.g. expansion plans, key contracts, timing',req:0},
    {k:'confirm',t:'check',q:'I confirm the information provided is accurate to the best of my knowledge.',req:1},
    {k:'share',t:'check',q:'I agree that Renewables Vault may share an anonymised summary of this asset with investors approved by our team. My company name, contact details and exact location are never shown.',req:1}
  ]}
];}
/* All document boxes for an asset, across the four steps */
function allDocSlots(type,a){var out=[];for(var i=0;i<4;i++)out=out.concat(docSlots(type,a,i).map(function(d){d.step=i;return d;}));return out;}
/* For assets submitted before the answers were kept: the usual documents */
var CORE_DOCS=['d_cr','d_contract','d_payments','d_fs','d_lic'];
var DOC_NAMES={d_photos:'Photos or company presentation',d_contract:'Signed main contract',d_payments:'Proof of buyer payments (last 12 months)',d_cr:'Commercial register and tax card',d_fs:'Audited financial statements',d_lic:'Licence and permits',d_loan:'Existing loan agreement or lender letter',d_val:'Valuation report'};
