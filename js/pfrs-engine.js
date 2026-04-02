// PFRS Engine - Framework Detection and Analysis

const PFRS_FRAMEWORKS = {
  FULL_PFRS: {
    name: 'Full PFRS',
    threshold: { assets: 350000000, liabilities: 250000000 },
    requirements: {
      disclosures: 42,
      audit: true,
      deferredTax: true,
      fairValue: true,
      segmentReporting: true,
      eps: true,
      cashFlow: true,
      financialInstruments: 'PFRS 7, 9, 13'
    },
    sections: [
      'PAS 1 - Presentation',
      'PAS 2 - Inventories',
      'PAS 7 - Cash Flow',
      'PAS 8 - Accounting Policies',
      'PAS 10 - Events After Reporting',
      'PAS 12 - Income Taxes',
      'PAS 16 - PPE',
      'PAS 19 - Employee Benefits',
      'PAS 24 - Related Parties',
      'PAS 36 - Impairment',
      'PAS 37 - Provisions',
      'PAS 38 - Intangibles',
      'PFRS 7 - Financial Instruments',
      'PFRS 9 - Financial Instruments',
      'PFRS 13 - Fair Value',
      'PFRS 15 - Revenue',
      'PFRS 16 - Leases'
    ]
  },
  
  PFRS_SME: {
    name: 'PFRS for SMEs',
    threshold: { assetsMin: 100000000, assetsMax: 350000000, liabilitiesMin: 100000000, liabilitiesMax: 250000000 },
    requirements: {
      disclosures: 22,
      audit: true,
      deferredTax: true,
      fairValue: 'limited',
      segmentReporting: false,
      eps: 'optional',
      cashFlow: true,
      financialInstruments: 'Section 11-12'
    },
    sections: [
      'Section 1 - SMEs',
      'Section 3 - Presentation',
      'Section 8 - Notes',
      'Section 11 - Financial Instruments',
      'Section 12 - Other Financial Instruments',
      'Section 13 - Inventories',
      'Section 17 - PPE',
      'Section 18 - Intangibles',
      'Section 23 - Revenue',
      'Section 27 - Impairment',
      'Section 28 - Employee Benefits',
      'Section 29 - Income Tax',
      'Section 33 - Related Parties'
    ]
  },
  
  PFRS_SE: {
    name: 'PFRS for SEs',
    threshold: { assetsMin: 3000000, assetsMax: 100000000, employees: { min: 10, max: 99 } },
    requirements: {
      disclosures: 10,
      audit: 'assets > 50M',
      deferredTax: false,
      fairValue: false,
      segmentReporting: false,
      eps: false,
      cashFlow: true,
      financialInstruments: 'Section 6 (basic)'
    },
    sections: [
      'Section 3 - Presentation',
      'Section 5 - Statement of Comprehensive Income',
      'Section 6 - Financial Instruments',
      'Section 7 - Revenue',
      'Section 8 - Leases',
      'Section 9 - Income Tax',
      'Section 10 - Related Parties',
      'Section 11 - Employee Benefits',
      'Section 12 - PPE',
      'Section 13 - Intangibles'
    ]
  },
  
  PFRS_MICRO: {
    name: 'PFRS for Micro Entities',
    threshold: { assets: 3000000 },
    requirements: {
      disclosures: 5,
      audit: false,
      deferredTax: false,
      fairValue: false,
      segmentReporting: false,
      eps: false,
      cashFlow: 'optional',
      financialInstruments: false
    },
    sections: [
      'Corporate Information',
      'Basis of Preparation',
      'Summary of Accounting Policies',
      'Property and Equipment',
      'Receivables and Payables'
    ]
  },
  
  PFRS_COOPERATIVE: {
    name: 'PFRS for Cooperatives',
    special: true,
    regulator: 'CDA',
    sections: [
      'CDA Financial Reporting Format',
      'Statutory Fund Disclosures',
      'Patronage Refund Computation',
      'Membership Equity'
    ]
  },
  
  PFRS_NPO: {
    name: 'PFRS for Non-Profit Organizations',
    special: true,
    sections: [
      'Restricted Funds',
      'Donations In Kind',
      'Program Expense Allocation',
      'Fund Accounting'
    ]
  },
  
  PFRS_GOVERNMENT: {
    name: 'PFRS for Government Entities',
    special: true,
    regulator: 'COA',
    sections: [
      'NGAS Implementation',
      'Budget Utilization',
      'Fund Accounting',
      'Subsidy Disclosures'
    ]
  }
};

function detectFramework(assets, liabilities, publiclyListed, industry, employees) {
  if (publiclyListed) return PFRS_FRAMEWORKS.FULL_PFRS;
  if (industry === 'banking' || industry === 'insurance' || industry === 'public_utility') {
    return PFRS_FRAMEWORKS.FULL_PFRS;
  }
  if (assets > 350000000 || liabilities > 250000000) return PFRS_FRAMEWORKS.FULL_PFRS;
  if (assets >= 100000000 && assets <= 350000000) return PFRS_FRAMEWORKS.PFRS_SME;
  if (assets >= 3000000 && assets < 100000000) return PFRS_FRAMEWORKS.PFRS_SE;
  if (assets < 3000000) return PFRS_FRAMEWORKS.PFRS_MICRO;
  if (industry === 'cooperative') return PFRS_FRAMEWORKS.PFRS_COOPERATIVE;
  if (industry === 'nonprofit') return PFRS_FRAMEWORKS.PFRS_NPO;
  if (industry === 'government') return PFRS_FRAMEWORKS.PFRS_GOVERNMENT;
  return PFRS_FRAMEWORKS.FULL_PFRS;
}

function getRequiredDisclosures(framework) {
  const disclosureMap = {
    'Full PFRS': [
      'Statement of Compliance',
      'Basis of Preparation',
      'Functional Currency',
      'Going Concern',
      'Use of Judgments and Estimates',
      'Summary of Accounting Policies',
      'Financial Instruments (PFRS 7/9)',
      'Fair Value Measurement (PFRS 13)',
      'Property and Equipment',
      'Intangible Assets',
      'Impairment (PAS 36)',
      'Leases (PFRS 16)',
      'Revenue (PFRS 15)',
      'Employee Benefits (PAS 19)',
      'Income Taxes (PAS 12)',
      'Related Parties (PAS 24)',
      'Segment Information (PFRS 8)',
      'Earnings Per Share (PAS 33)',
      'Contingent Liabilities',
      'Events After Reporting Period',
      'Capital Management',
      'Financial Risk Management'
    ],
    'PFRS for SMEs': [
      'Statement of Compliance',
      'Basis of Preparation',
      'Summary of Accounting Policies',
      'Use of Judgments and Estimates',
      'Property and Equipment',
      'Financial Instruments (Sections 11-12)',
      'Revenue (Section 23)',
      'Employee Benefits (Section 28)',
      'Income Tax (Section 29)',
      'Related Parties (Section 33)',
      'Events After Reporting'
    ],
    'PFRS for SEs': [
      'Corporate Information',
      'Statement of Compliance',
      'Basis of Preparation',
      'Property and Equipment',
      'Revenue Recognition',
      'Income Tax',
      'Employee Benefits',
      'Events After Reporting'
    ],
    'PFRS for Micro Entities': [
      'Corporate Information',
      'Basis of Preparation',
      'Property and Equipment',
      'Receivables and Payables',
      'Income Tax'
    ]
  };
  return disclosureMap[framework.name] || disclosureMap['Full PFRS'];
}

function calculateMigrationPath(currentFramework, projectedAssets, projectedLiabilities) {
  const frameworks = ['PFRS for Micro Entities', 'PFRS for SEs', 'PFRS for SMEs', 'Full PFRS'];
  const currentIndex = frameworks.indexOf(currentFramework.name);
  let targetFramework = null;
  let targetIndex = -1;
  
  for (let i = 0; i < frameworks.length; i++) {
    const framework = frameworks[i];
    const thresholds = PFRS_FRAMEWORKS[framework.replace(/\s/g, '_').toUpperCase()]?.threshold;
    if (thresholds) {
      const maxAssets = thresholds.assetsMax || thresholds.assets;
      if (projectedAssets <= maxAssets) {
        targetFramework = framework;
        targetIndex = i;
        break;
      }
    }
  }
  
  if (targetIndex <= currentIndex) return null;
  
  return {
    from: currentFramework.name,
    to: targetFramework,
    additionalDisclosures: (targetIndex - currentIndex) * 8,
    estimatedPreparationHours: (targetIndex - currentIndex) * 40,
    transitionPeriod: targetIndex - currentIndex === 1 ? '1 year' : '2-3 years',
    requiresAudit: targetFramework !== 'PFRS for Micro Entities',
    requiresDeferredTax: targetFramework === 'PFRS for SMEs' || targetFramework === 'Full PFRS'
  };
}

function getIndustrySpecificRequirements(industry) {
  const requirements = {
    banking: {
      regulator: 'BSP',
      specialDisclosures: ['Capital Adequacy Ratio', 'Loan Impairment', 'Deposit Liabilities'],
      filingDeadline: '90 days after year end'
    },
    insurance: {
      regulator: 'IC',
      specialDisclosures: ['Insurance Contract Liabilities', 'Reinsurance', 'Claims Development'],
      filingDeadline: '90 days after year end'
    },
    realestate: {
      regulator: 'HLURB/DHSUD',
      specialDisclosures: ['Investment Property Valuation', 'Construction in Progress', 'Reservation Receivables'],
      filingDeadline: '120 days after year end'
    },
    construction: {
      specialDisclosures: ['Contract Assets/Liabilities', 'Retention Receivables', 'Performance Obligations'],
      filingDeadline: '120 days after year end'
    },
    agriculture: {
      specialDisclosures: ['Biological Assets (PAS 41)', 'Agricultural Produce', 'Government Grants'],
      filingDeadline: '120 days after year end'
    },
    cooperative: {
      regulator: 'CDA',
      specialDisclosures: ['Statutory Funds', 'Patronage Refund', 'Member Equity'],
      filingDeadline: '90 days after year end'
    },
    nonprofit: {
      specialDisclosures: ['Restricted Funds', 'Donations In Kind', 'Program Expenses'],
      filingDeadline: '120 days after year end'
    }
  };
  return requirements[industry] || { specialDisclosures: [], filingDeadline: '120 days after year end' };
}