// SEC Compliance Engine

const SEC_MEMORANDUM_CIRCULARS = {
  MC_3_2018: {
    title: 'PFRS for Micro Entities',
    effective: '2018',
    applicability: 'Assets < P3M',
    requirements: ['Simplified FS', 'Minimum 5 notes', 'No audit required']
  },
  MC_12_2019: {
    title: 'Materiality and Simplified Disclosures',
    effective: '2019',
    applicability: 'All non-public entities',
    requirements: ['Materiality threshold 1% of assets or 5% of net income', 'Optional omission of immaterial items']
  },
  MC_7_2020: {
    title: 'COVID-19 Disclosures',
    effective: '2020-2022',
    applicability: 'All entities',
    requirements: ['Going concern with COVID impact', 'Government assistance', 'Impairment with forward-looking']
  },
  MC_14_2021: {
    title: 'Climate Change Disclosures',
    effective: '2021',
    applicability: 'Publicly listed',
    requirements: ['Climate risks', 'Emissions', 'Scenario analysis']
  },
  MC_1_2022: {
    title: 'Sustainability Reporting',
    effective: '2022',
    applicability: 'Publicly listed and large entities',
    requirements: ['ESG metrics', 'Board oversight', 'Third-party assurance']
  },
  MC_3_2023: {
    title: 'Digital Assets',
    effective: '2023',
    applicability: 'Entities with crypto/digital assets',
    requirements: ['Classification', 'Valuation', 'Custody disclosures']
  },
  MC_8_2023: {
    title: 'AI in Financial Reporting',
    effective: '2023',
    applicability: 'Entities using AI in FS preparation',
    requirements: ['AI systems used', 'Human oversight', 'Audit trail']
  },
  MC_15_2024: {
    title: 'Enhanced Related Party Disclosures',
    effective: '2024',
    applicability: 'All corporations',
    requirements: ['RPT approval process', 'Fairness opinion', 'Key management compensation details']
  },
  MC_18_2024: {
    title: 'ESG Integrated Reporting',
    effective: '2024',
    applicability: 'Publicly listed',
    requirements: ['ESG integration strategy', '37 performance indicators', 'Assurance']
  },
  MC_22_2024: {
    title: 'Transfer Pricing Disclosures',
    effective: '2024',
    applicability: 'Entities with RPT',
    requirements: ['Cross-reference to TP docs', 'Arm\'s length declaration', 'Methodology disclosure']
  },
  MC_25_2024: {
    title: 'DeFi and Blockchain',
    effective: '2024',
    applicability: 'Entities in DeFi',
    requirements: ['Smart contract risks', 'Protocol exposure', 'Liquidity pools']
  }
};

function calculateSECDeadline(fiscalYearEnd, entityType) {
  const yearEnd = new Date(fiscalYearEnd);
  const year = yearEnd.getFullYear();
  let deadline = new Date(yearEnd);
  
  if (entityType === 'stock') {
    deadline.setDate(deadline.getDate() + 120);
  } else if (entityType === 'nonstock') {
    deadline.setDate(deadline.getDate() + 120);
    deadline.setMonth(4); // May 15 for calendar year
  } else if (entityType === 'branch') {
    deadline.setDate(deadline.getDate() + 180);
  }
  
  return deadline;
}

function calculatePenalty(daysLate, basicFee) {
  let penalty = 0;
  if (daysLate <= 30) {
    penalty = basicFee * 0.01 * Math.ceil(daysLate / 30);
  } else {
    penalty = basicFee * 0.02 * Math.ceil(daysLate / 30);
  }
  return Math.min(penalty, basicFee * 0.5);
}

function getSECSupplementarySchedules(framework) {
  const schedules = {
    'Full PFRS': [
      'A - Financial Assets',
      'B - Receivables',
      'C - Inventories',
      'D - Property and Equipment',
      'E - Intangible Assets',
      'F - Long Term Debt',
      'G - Retirement Fund',
      'H - Income Taxes',
      'I - Contingent Liabilities',
      'J - Capital Stock',
      'K - Retained Earnings',
      'L - Related Party Transactions'
    ],
    'PFRS for SMEs': [
      'A - Financial Assets',
      'B - Receivables',
      'D - Property and Equipment',
      'F - Long Term Debt',
      'L - Related Party Transactions'
    ],
    'PFRS for SEs': [
      'B - Receivables',
      'D - Property and Equipment'
    ],
    'PFRS for Micro Entities': []
  };
  return schedules[framework.name] || schedules['Full PFRS'];
}

function validateAuditReport(auditReport) {
  const requiredElements = [
    'independent auditor\'s report',
    'opinion paragraph',
    'basis for opinion',
    'management responsibility',
    'auditor responsibility',
    'signature',
    'date'
  ];
  
  const missing = [];
  requiredElements.forEach(element => {
    if (!auditReport.toLowerCase().includes(element)) {
      missing.push(element);
    }
  });
  
  return {
    valid: missing.length === 0,
    missing: missing,
    score: Math.max(0, 100 - (missing.length * 15))
  };
}

function getSECFilingRequirements(entityType, framework) {
  const requirements = {
    requiredForms: ['AFS', 'GIS'],
    supplementarySchedules: getSECSupplementarySchedules(framework),
    certifications: ['President', 'Treasurer', 'Corporate Secretary'],
    attachments: ['Audit Report', 'Management Responsibility Statement', 'Board Approval']
  };
  
  if (entityType === 'stock') {
    requirements.requiredForms.push('Annual Report');
  }
  
  if (framework.name === 'Full PFRS') {
    requirements.additionalRequirements = ['XML Extract', 'Digital Signatures'];
  }
  
  return requirements;
}