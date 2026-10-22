/* Renewables Vault: asset profile questions (RARE™ intake by Jacob) and document rules,
 * shared by the developer dashboard and the admin panel.
 * Answers are sent as option keys only. The assessment itself is calculated on the server and is never shown here.
 * The document rules must match jacobDocs_ in the server script. */
var TYPES={
  biofuel:{label:'Biofuel & Biodiesel',icon:'fa-gas-pump',desc:'Biodiesel and biofuel plants selling to industrial buyers.'},
  circular:{label:'Circular Economy (Waste Recycling)',icon:'fa-recycle',desc:'Recycling and recovery facilities.'},
  solar:{label:'Solar C&I (Commercial & Industrial)',icon:'fa-solar-panel',desc:'Solar systems supplying businesses, factories and farms.'}
};
var FORM_VERSION=2;
function typeKey(label){label=String(label||'');return /circular|recycl/i.test(label)?'circular':/solar/i.test(label)?'solar':/bio/i.test(label)?'biofuel':'';}
function O(pairs){return pairs.map(function(p){return{v:p[0],t:p[1]};});}
var CAPACITY={
  biofuel:{k:'b_cap',t:'text',q:'Production capacity',ph:'e.g. 15,000 tonnes per year',req:1},
  circular:{k:'c_cap',t:'text',q:'Processing capacity',ph:'e.g. 30,000 tonnes per year',req:1},
  solar:{k:'s_cap',t:'text',q:'Installed capacity',ph:'e.g. 2.5 MWp',req:1}
};
/* Documents. tier: mand = needed to submit, expl = upload or explain, opt = optional.
 * when(a): the document is asked for only if this returns true (mandatory ones are skipped when the answer says they cannot exist). */
var DOCS={
  d_cr:{l:'Commercial register extract',h:'Confirms the legal entity, ownership and registration date.',tier:'mand'},
  d_contract:{l:'Signed contract with the buyer',h:'All pages, including the signature page. Our team checks the contract type, term and pricing.',tier:'mand',when:function(a){return a.rq1!=='none';}},
  d_offfin:{l:'Buyer’s financial statements or credit rating',h:'The buyer’s latest audited financial statements or a credit rating certificate. For multinationals, the public annual report is fine.',tier:'expl'},
  d_payments:{l:'Bank statements showing the buyer’s payments',h:'12 to 24 months of bank statements showing payments received from the buyer, or a certified payment register.',tier:'mand',when:function(a){return a.history!=='lt6';}},
  d_cod:{l:'Commissioning certificate',h:'Commercial operation date certificate, commissioning report or grid connection certificate confirming the asset is operating.',tier:'mand',when:function(a){return a.ap1!=='pre';}},
  d_scada:{l:'Production report for the last 12 months',h:'A monitoring (SCADA) export or production report showing monthly output and availability. PDF, Excel or CSV.',tier:'expl'},
  d_ins:{l:'Insurance certificate',h:'Your current all-risk policy certificate showing cover limits, expiry date and the insured party. Include business interruption cover if you have it.',tier:'expl'},
  d_fs:{l:'Company financial statements (last 2 years)',h:'Audited income statement, balance sheet and cash flow. If they are not audited, the last 12 months of management accounts signed by your finance lead.',tier:'expl'},
  d_mgmt:{l:'Management CVs, tax clearance and legal declaration',h:'CVs of your CEO, finance lead and technical lead in one file, your current tax clearance certificate, and a litigation search or a signed declaration that there is no material legal action.',tier:'expl'},
  d_legal:{l:'Legal opinion or title document',h:'A legal opinion from licensed local counsel confirming the revenue can be assigned, or a title search or ownership certificate showing clear title to the asset and the right to assign its revenue.',tier:'expl'},
  d_val:{l:'Asset valuation report',h:'An independent valuation or bank appraisal of the asset, dated within the last 24 months and issued by a certified valuer.',tier:'expl'},
  d_fx:{l:'Currency indexation clause',h:'If your revenue is indexed to US dollars or euros: the contract clause or agreement showing the reference rate (for example the Central Bank of Egypt rate) and how it is converted.',tier:'opt'},
  d_ce:{l:'Guarantee or credit insurance policy',h:'A trade credit insurance schedule (Euler Hermes, Atradius, Coface or ATI), a bank guarantee letter, or a signed parent company guarantee.',tier:'opt'}
};
var NA_REASONS=['The document does not exist','Confidential, we will share it under an NDA','Being prepared by a third party','Not applicable to this asset','Other'];
function steps(type){return [
  {title:'The asset',desc:'Basic information about the asset and the financing you are looking for.',qs:[
    {k:'a_name',t:'text',q:'Asset name',ph:'e.g. 10th of Ramadan Biodiesel Plant',req:1},
    {k:'a_loc',t:'text',q:'Location (city or governorate)',ph:'e.g. 10th of Ramadan City, Sharqia',req:1},
    {k:'a_country',t:'radio',q:'Country',req:1,o:O([['Egypt','Egypt'],['KSA','Saudi Arabia'],['Morocco','Morocco'],['Kenya','Kenya'],['South Africa','South Africa'],['Other','Other']])},
    CAPACITY[type],
    {k:'rpa',t:'num',q:'Amount of capital you are seeking (USD equivalent)',ph:'e.g. 1,200,000',req:1},
    {k:'tenor',t:'radio',q:'Preferred term',req:1,o:O([['1','1 year'],['2','2 years'],['3','3 years'],['4','4 years'],['5','5 years']])},
    {k:'offtaker',t:'text',q:'Name of the main buyer or client',ph:'e.g. the company that buys your output',hint:'Kept strictly confidential. It is never shown to investors.',req:1,doc:'d_cr'}
  ]},
  {title:'Contracts & revenue',desc:'How the asset earns its revenue, and who pays it.',qs:[
    {k:'rq1',t:'radio',q:'What kind of contract covers the revenue?',req:1,doc:'d_contract',o:O([['lt_ig','Long-term power purchase or fuel supply contract with a government or investment-grade buyer (20 years or more)'],['mt_priv','Medium-term contract with an established private buyer (5 to 20 years, fixed price)'],['short','Short-term or rolling contracts (under 5 years)'],['none','No signed contract (spot or merchant sales)']])},
    {k:'rq2',t:'radio',q:'Credit quality of the buyer',req:1,doc:'d_offfin',o:O([['ig','Multinational or rated company (investment grade)'],['local','Established local company with audited accounts and a clean payment record'],['sme','Small or private company with limited financial information'],['weak','Unrated, behind on payments, or not enough information']])},
    {k:'currency',t:'radio',q:'Currency of the revenue',req:1,o:O([['usd','US dollars or euros'],['idx','Egyptian pounds indexed to the US dollar or euro'],['local','Local currency only']])},
    {k:'history',t:'radio',q:'Months of actual payment history',req:1,doc:'d_payments',o:O([['m24','More than 24 months, verifiable'],['m12','12 to 24 months'],['m6','6 to 12 months'],['lt6','Less than 6 months, or not yet operating']])},
    {k:'concentration',t:'radio',q:'Share of revenue from your largest buyer',req:1,o:O([['multi','Several buyers, none above 50%'],['p50','One main buyer, 50% to 80%'],['p80','One buyer above 80%, with strong credit'],['single','One buyer at 100%, small or weak credit']])}
  ]},
  {title:'Operations',desc:'How the asset performs today.',qs:[
    {k:'ap1',t:'radio',q:'Operating status',req:1,doc:'d_cod',o:O([['m24','Operating for more than 24 months, with full production records'],['m6','Operating for 6 to 24 months'],['lt6','Operating for less than 6 months (ramp-up)'],['pre','Not yet commissioned, or under construction']])},
    {k:'availability',t:'radio',q:'Availability (uptime) over the last 12 months',req:1,o:O([['a95','95% or more'],['a85','85% to 95%'],['a75','75% to 85%'],['low','Below 75%, or not measured']])},
    {k:'oem',t:'radio',q:'Operation and maintenance',req:1,doc:'d_scada',o:O([['third','Contract with a specialist operator'],['self','We operate it ourselves with a qualified team'],['none','No formal maintenance arrangement']])},
    {k:'insurance',t:'radio',q:'Insurance',req:1,doc:'d_ins',o:O([['named','Active, and Renewables Vault can be added as an additional insured'],['active','Active, but it cannot name third parties'],['none','No insurance, or it has expired']])},
    {k:'permits',t:'radio',q:'Environmental and regulatory permits',req:1,o:O([['ok','All current, no compliance issues'],['pending','In place, renewals pending'],['issues','Expired, or there are compliance issues']])}
  ]},
  {title:'Your company',desc:'Your company’s financial strength, team and track record.',qs:[
    {k:'ds1',t:'radio',q:'Company finances',req:1,doc:'d_fs',o:O([['strong','Audited accounts: profitable, low debt, strong cash position'],['adequate','Audited accounts: adequate margins, moderate debt'],['mgmt','Management accounts only'],['none','No accounts available, or under financial pressure']])},
    {k:'mgmt',t:'radio',q:'Management experience in renewable energy',req:1,o:O([['y5','More than 5 years, several completed projects'],['y2','2 to 5 years, at least one operating asset'],['new','Less than 2 years, or this is our first project']])},
    {k:'portfolio',t:'radio',q:'Operating assets in your portfolio',req:1,doc:'d_mgmt',o:O([['p3','3 or more'],['p2','2'],['p1','This asset only']])},
    {k:'legal',t:'radio',q:'Legal and regulatory standing',req:1,o:O([['clean','No pending disputes or regulatory issues'],['minor','Minor issues that do not affect the asset'],['pending','Pending legal or regulatory action affecting the asset']])},
    {k:'governance',t:'radio',q:'Ownership and governance',req:1,o:O([['clear','Clear ownership and documented governance'],['informal','Clear ownership, informal governance'],['disputed','Disputed or unclear ownership']])}
  ]},
  {title:'Legal & security',desc:'How the financing would be secured.',qs:[
    {k:'le1',t:'radio',q:'Can the contract revenue be formally assigned to a Renewables Vault financing vehicle?',req:1,doc:'d_legal',o:O([['yes','Yes, confirmed by a legal opinion'],['likely','Likely: no legal opinion yet, but no known obstacles'],['blocked','Uncertain, or blocked by existing lenders or contract terms']])},
    {k:'pledge',t:'radio',q:'Can a registered pledge over the asset be created?',req:1,o:O([['free','Yes, the asset is free of charges'],['partial','Partly: there is an existing charge, with value remaining'],['no','No, it is fully charged or legally blocked']])},
    {k:'escrow',t:'radio',q:'Would you open a controlled collection (escrow) account?',req:1,doc:'d_val',o:O([['yes','Yes, with no restrictions'],['bank','Yes, subject to bank confirmation'],['no','No, or restricted by existing arrangements']])},
    {k:'lender',t:'radio',q:'Bank loans on this asset',req:1,o:O([['none','No bank debt on this asset'],['likely','Yes, and the lender is likely to consent'],['refused','Yes, and the lender has not been approached or has refused']])},
    {k:'govlaw',t:'radio',q:'Preferred way to resolve disputes',req:1,o:O([['intl','International arbitration (for example ADGM, LCIA, ICC or DIAC)'],['mixed','Local courts with an arbitration clause'],['local','Local courts only']])}
  ]},
  {title:'Market',desc:'Currency, regulatory and market exposure.',qs:[
    {k:'mm1',t:'radio',q:'Currency exposure',req:1,doc:'d_fx',o:O([['indexed','Revenue in, or indexed to, US dollars or euros'],['partial','Local currency with partial protection'],['none','Local currency only, with no indexation or protection']])},
    {k:'reg',t:'radio',q:'Stability of the regulations for your sector',req:1,o:O([['stable','Stable: clear licensing and no retroactive changes'],['review','Some uncertainty, policy under review'],['risky','A history of retroactive changes']])},
    {k:'sector',t:'radio',q:'Your buyer’s sector',req:1,o:O([['low','Stable sectors such as pharmaceuticals, food or utilities'],['mid','Industrial sectors such as cement or manufacturing'],['high','Cyclical or commodity-linked sectors']])},
    {k:'political',t:'radio',q:'Country and political risk',req:1,o:O([['low','Low: stable government and strong rule of law'],['mid','Moderate: some instability, but manageable'],['high','High: conflict, sanctions or a history of expropriation']])},
    {k:'climate',t:'radio',q:'Physical and climate risk to the asset',req:1,o:O([['low','Low: assessed and covered by insurance'],['mid','Moderate: partly covered'],['high','High: not covered']])}
  ]},
  {title:'Guarantees & recovery',desc:'Your payment track record and any extra protection you can offer.',qs:[
    {k:'dr1',t:'radio',q:'Your company’s payment track record',req:1,o:O([['low','Strong cash flow, no past defaults, low debt'],['mod','Adequate cash flow, some debt, clean record'],['elev','Thin cash flow, or a past restructuring'],['high','Past defaults, insolvency risk, or no data']])},
    {k:'asset_val',t:'num',q:'Estimated value of the asset (USD equivalent)',ph:'e.g. 2,000,000',hint:'The value in your valuation report, if you have one.',req:1},
    {k:'enhancement',t:'radio',q:'Extra protection you can offer',req:1,doc:'d_ce',o:O([['bank','Bank guarantee or an active trade credit insurance policy'],['corp','Company or shareholder guarantee'],['disc','In discussion, not yet confirmed'],['none','None available']])},
    {k:'tci',t:'radio',q:'Trade credit insurance',req:1,o:O([['active','Active policy (Euler Hermes, Atradius, Coface or ATI)'],['applying','Application in progress'],['none','None arranged']])},
    {k:'enforcement',t:'radio',q:'If a payment dispute had to be enforced, how long would it likely take?',req:1,o:O([['lt6','Under 6 months'],['m18','6 to 18 months'],['gt18','Over 18 months']])},
    {k:'q66',t:'area',q:'Anything else we should know? (optional)',ph:'e.g. expansion plans, key contracts, timing',req:0},
    {k:'confirm',t:'check',q:'I confirm the information provided is accurate to the best of my knowledge.',req:1},
    {k:'share',t:'check',q:'I agree that Renewables Vault may share an anonymised summary of this asset with investors approved by our team. My company name, the buyer’s name, contact details and exact location are never shown.',req:1}
  ]}
];}
var DOC_EXT=/\.(pdf|jpe?g|png|webp|heic|docx?|xlsx?|pptx?|csv)$/i,DOC_ACCEPT='.pdf,.jpg,.jpeg,.png,.webp,.heic,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.csv',DOC_MAX=10*1024*1024,DOC_PER_SLOT=5;
function contractLabel(t){return DOCS.d_contract.l;}
/* Document boxes for one step, placed under the question they support */
function docSlots(type,a,step){a=a||{};var out=[];
  steps(type)[step].qs.forEach(function(q){var k=q.doc;if(!k)return;var d=DOCS[k];if(d.when&&!d.when(a))return;
    out.push({k:k,l:d.l,h:d.h,tier:d.tier,req:d.tier==='mand'?1:0,after:q.k});});
  return out;}
function allDocSlots(type,a){var out=[];for(var i=0;i<7;i++)out=out.concat(docSlots(type,a,i).map(function(d){d.step=i;return d;}));return out;}
/* For assets submitted before the current form: the usual documents */
var CORE_DOCS=['d_cr','d_contract','d_payments','d_fs','d_lic'];
var DOC_NAMES={d_photos:'Photos or company presentation',d_contract:'Signed main contract',d_payments:'Proof of buyer payments (last 12 months)',d_cr:'Commercial register and tax card',d_fs:'Audited financial statements',d_lic:'Licence and permits',d_loan:'Existing loan agreement or lender letter',d_val:'Valuation report',
  d_offfin:'Buyer financial statements or credit rating',d_cod:'Commissioning certificate',d_scada:'Production report (12 months)',d_ins:'Insurance certificate',d_mgmt:'Management CVs, tax clearance and legal declaration',d_legal:'Legal opinion or title document',d_fx:'Currency indexation clause',d_ce:'Guarantee or credit insurance policy'};
