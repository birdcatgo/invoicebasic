export default function handler(req, res) {
    const networks = [
      'Pure Ads',
      'Transparent',
      'HAF',
      'C3',
      'Suited',
      'Leadnomics',
      'Wisdom',
      'WeCall',
      'TLG',
      'WeGenerate',
      'QDM',
      'QLG',
      'Leads Icon',
      'PMC',
      'THS & Fil Digital',
      'Digi & Ocean Beach',
      'ULC',
      'Rubicon',
      'Clickbank',
    ];
  
    res.status(200).json(networks);
  }