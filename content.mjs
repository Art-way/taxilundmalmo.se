export const cities = {
  lund: {
    name: 'Lund', label: 'UNIVERSITETSSTADEN',
    intro: 'Från kullerstensgatorna i Lund till avgångshallen. Välj Kastrup eller Malmö Airport och se priset innan du planerar resten av resan.',
    areas: [
      ['dalby', 'Dalby', 'Ange gatuadress och husnummer i Dalby. Om du vill mötas vid torget, beskriv vilken sida som passar dig.'],
      ['sodra-sandby', 'Södra Sandby', 'Skriv hela adressen i Södra Sandby och ange om bilen kan stanna vid entrén.'],
      ['veberod', 'Veberöd', 'Ange adressen i Veberöd, även när du har en platsbeskrivning. Skriv var du väntar om du vill bli hämtad utanför entrén.'],
      ['genarp', 'Genarp', 'Vid hämtning utanför Genarps tätort är ett husnummer eller en tydlig vägbeskrivning särskilt praktiskt.'],
      ['stangby', 'Stångby', 'Om du vill mötas vid Stångby station, ange vilken sida av järnvägen du befinner dig på.'],
      ['revinge', 'Revinge', 'Ange både gatunamn och ort. Lägg till uppgifter om infart eller grind om adressen är svår att hitta.'],
      ['torna-hallestad', 'Torna Hällestad', 'Vid hämtning längs en mindre väg kan du ange en plats där en bil får stanna.'],
      ['vallkarra', 'Vallkärra', 'Skriv Vallkärra tillsammans med den fullständiga adressen så att rätt upphämtningsplats blir tydlig.'],
      ['norra-faladen', 'Norra Fäladen', 'Vid bostadshus med flera portar hjälper det att ange portnummer och vilken gata bilen kan köra fram på.'],
    ],
  },
  malmo: {
    name: 'Malmö', label: 'STADEN VID SUNDET',
    intro: 'Från Malmö och ut mot världen. Se ditt fasta pris till Kastrup eller Malmö Airport och välj när du vill bli hämtad.',
    areas: [
      ['hyllie', 'Hyllie', 'Vid hämtning nära stationen, köpcentret eller arenan kan du ange entréns namn och vilken gata du väntar på.'],
      ['limhamn', 'Limhamn', 'Ange gatuadress och lägg till en mötespunkt om entrén vetter mot en gågata eller gård.'],
      ['oxie', 'Oxie', 'Om du utgår från Oxie station, ange en gata eller entré där bilen kan möta dig.'],
      ['bunkeflostrand', 'Bunkeflostrand', 'Ange gatunamn och husnummer och lägg till port eller infart om bostaden ligger bakom en gård.'],
      ['vastra-hamnen', 'Västra Hamnen', 'Vid hämtning längs kajen kan du välja en närliggande gatuadress där en bil får stanna.'],
      ['rosengard', 'Rosengård', 'Vid ett bostadskvarter med flera ingångar är det bra att ange portnummer och var entrén ligger.'],
      ['kirseberg', 'Kirseberg', 'Skriv både gatuadress och portnummer om du vill bli hämtad vid en viss ingång.'],
      ['tygelsjo', 'Tygelsjö', 'Ange fullständig adress i Tygelsjö. Om upphämtningen är vid en hållplats, beskriv en lämplig mötespunkt intill.'],
      ['klagshamn', 'Klagshamn', 'Om upphämtningen är nära kusten, använd en gatuadress eller en tydligt namngiven mötesplats.'],
    ],
  },
};

export const airports = {
  kastrup: { name: 'Kastrup', full: 'Köpenhamns flygplats', code: 'CPH', slug: 'kastrup', country: 'Danmark' },
  sturup: { name: 'Malmö Airport', full: 'Malmö Airport (Sturup)', code: 'MMX', slug: 'malmo-airport', country: 'Sverige' },
};

export const prices = {
  lund: { kastrup: 1250, sturup: 570 },
  malmo: { kastrup: 950, sturup: 610 },
};

export const guides = [
  {
    slug: 'malmo-airport-eller-kastrup', title: 'Malmö Airport eller Kastrup?', tag: 'FLYGPLATSER', icon: 'plane',
    intro: 'Två flygplatser, två koder. Kontrollera din biljett innan du väljer destination.',
    sections: [
      ['CPH är Kastrup', 'Köpenhamns flygplats ligger i Danmark. På biljetten står det CPH. Välj Kastrup i reseväljaren och kontrollera din terminal med flygbolaget.'],
      ['MMX är Malmö Airport', 'Malmö Airport kallas också Sturup. På biljetten står det MMX. Välj Malmö Airport i reseväljaren.'],
    ],
  },
  {
    slug: 'planera-hamtning-infor-flyget', title: 'Så planerar du hämtning inför flyget', tag: 'PLANERA RESAN', icon: 'clock',
    intro: 'Sätt tiden för när bilen ska hämta dig utifrån när du behöver vara på flygplatsen.',
    sections: [
      ['Börja med flygbolagets tider', 'Kontrollera när incheckning och bagageinlämning stänger för din avgång. Lägg sedan till marginal för vägen till terminalen.'],
      ['Gör det enkelt att hitta dig', 'Ange gatuadress, port eller hotellentré. Kom överens om en tydlig mötesplats om bilen har svårt att komma fram till adressen.'],
    ],
  },
  {
    slug: 'hamtning-lund-centralstation', title: 'Hämtning vid Lund Centralstation', tag: 'MÖTESPLATSER', icon: 'pin',
    intro: 'Gör bytet från tåg till taxi enklare med en tydligt angiven mötesplats.',
    sections: [
      ['Välj en sida av stationen', 'Ange vilken sida av spåren du går ut på och använd en namngiven entré eller gatuadress. Följ skyltningen på plats.'],
      ['Lämna tid för bytet', 'Räkna med tid för att ta dig från perrongen till mötesplatsen, särskilt om du reser med mycket bagage.'],
    ],
  },
  {
    slug: 'hamtning-malmo-centralstation', title: 'Hämtning vid Malmö Centralstation', tag: 'MÖTESPLATSER', icon: 'pin',
    intro: 'Malmö C har flera utgångar. Lägg till entré eller gata i dina reseuppgifter.',
    sections: [
      ['Bestäm var ni ska mötas', 'Ange en skyltad utgång eller gatuadress och kontrollera var en bil kan stanna. Skriv namnet på mötesplatsen i reseuppgifterna.'],
      ['Välj rätt flygplats', 'Vid byte till flygtaxi, kontrollera om biljetten gäller CPH (Kastrup) eller MMX (Malmö Airport) innan du väljer destination.'],
    ],
  },
  {
    slug: 'resa-med-barn-i-taxi', title: 'Resa med barn i taxi', tag: 'FÖR FAMILJER', icon: 'users',
    intro: 'Planera sittplatser, eventuell barnstol och bagage i god tid.',
    sections: [
      ['Berätta vad ni behöver', 'Ange hur många vuxna och barn som reser. Om ni behöver barnstol, be att rätt typ av utrustning bekräftas före resan.'],
      ['Räkna med barnvagnen', 'Beskriv hur mycket plats barnvagn och väskor tar. Det underlättar valet av bil.'],
    ],
  },
  {
    slug: 'bagage-i-flygtaxi', title: 'Bagage i flygtaxi', tag: 'INFÖR RESAN', icon: 'case',
    intro: 'Planera bilens utrymme efter hur många som reser och vad ni tar med.',
    sections: [
      ['Räkna väskorna', 'Räkna både stora väskor och handbagage. Skriv om något är extra stort, till exempel en golfbag eller hopfällbar barnvagn.'],
      ['Dubbelkolla specialbagage', 'Be om bekräftelse att specialbagaget får plats före resan. Kontrollera också vad flygbolaget tillåter på din biljett.'],
    ],
  },
];
