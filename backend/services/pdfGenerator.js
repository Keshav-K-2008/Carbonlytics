import PDFDocument from 'pdfkit';

export class PDFGeneratorService {
  /**
   * Generates a beautifully-designed PDF sustainability report and pipes it to the response stream
   */
  static generateReportPDF(stream, reportData) {
    const doc = new PDFDocument({
      size: 'A4',
      margin: 50,
      bufferPages: true,
    });

    // Pipe PDF doc to the output stream
    doc.pipe(stream);

    const primaryColor = '#0d5c3a'; // Forest Green
    const secondaryColor = '#0891b2'; // Cyan
    const darkColor = '#1f2937'; // Slate
    const lightBgColor = '#f3f4f6'; // Light Grey
    const whiteColor = '#ffffff';

    // --- PAGE HEADER ---
    const drawHeader = (pageNum, totalPages) => {
      doc.save();
      // Draw decorative header banner
      doc.rect(0, 0, doc.page.width, 15).fill(primaryColor);
      
      // Footer text
      doc.rect(0, doc.page.height - 35, doc.page.width, 35).fill(lightBgColor);
      doc.fillColor(darkColor)
         .fontSize(9)
         .text('Carbonlytix – Carbon Footprint Awareness Platform', 50, doc.page.height - 23)
         .text(`Page ${pageNum} of ${totalPages}`, doc.page.width - 120, doc.page.height - 23, { align: 'right', width: 70 });
      doc.restore();
    };

    // --- PAGE 1: COVER & DASHBOARD SUMMARY ---
    // Title
    doc.fillColor(primaryColor)
       .fontSize(32)
       .text('Carbonlytix', 50, 60, { lineGap: 4 })
       .fillColor(darkColor)
       .fontSize(16)
       .text('Personal Carbon Footprint Analysis Report', 50, 100);

    // Metadata Block (Grey Box)
    doc.rect(50, 130, 495, 80).fill(lightBgColor);
    doc.fillColor(darkColor).fontSize(10);
    doc.text(`User Name: ${reportData.fullName}`, 70, 145);
    doc.text(`Email Address: ${reportData.email}`, 70, 160);
    doc.text(`Eco Level: ${reportData.level}`, 70, 175);
    doc.text(`Total Score Points: ${reportData.points}`, 70, 190);
    doc.text(`Report Period: ${reportData.startDate} to ${reportData.endDate}`, doc.page.width - 240, 145);
    doc.text(`Report Generated: ${new Date().toLocaleDateString()}`, doc.page.width - 240, 160);

    // Grand Metrics Section
    doc.fillColor(primaryColor)
       .fontSize(16)
       .text('Emissions Overview Summary', 50, 235);
    
    // Grid boxes for metrics
    const boxY = 260;
    const boxH = 90;
    const boxW = 155;
    
    // Box 1: Total Footprint
    doc.rect(50, boxY, boxW, boxH).fill('#ecfdf5'); // Mint green
    doc.fillColor(primaryColor).fontSize(10).text('TOTAL EMISSIONS', 65, boxY + 15);
    doc.fontSize(22).text(`${reportData.totalEmissions.toFixed(1)}`, 65, boxY + 35);
    doc.fontSize(9).fillColor(darkColor).text('kg CO2e logged', 65, boxY + 62);

    // Box 2: Average Benchmark comparison
    const benchmarkPct = Math.round((reportData.totalEmissions / reportData.benchmarkEmissions) * 100) || 100;
    doc.rect(220, boxY, boxW, boxH).fill(benchmarkPct <= 100 ? '#f0fdfa' : '#fef2f2'); // Cyan/Red
    doc.fillColor(benchmarkPct <= 100 ? secondaryColor : '#b91c1c')
       .fontSize(10)
       .text('VS DAILY BENCHMARK', 235, boxY + 15);
    doc.fontSize(22).text(`${benchmarkPct}%`, 235, boxY + 35);
    doc.fontSize(9).fillColor(darkColor).text(benchmarkPct <= 100 ? 'Below global average' : 'Above average threshold', 235, boxY + 62);

    // Box 3: Sustainability Score
    doc.rect(390, boxY, boxW, boxH).fill('#eff6ff'); // Blue
    doc.fillColor('#1d4ed8').fontSize(10).text('SUSTAINABILITY SCORE', 405, boxY + 15);
    doc.fontSize(22).text(`${reportData.sustainabilityScore}/100`, 405, boxY + 35);
    doc.fontSize(9).fillColor(darkColor).text('Based on active habits', 405, boxY + 62);

    // Category Breakdowns Table
    doc.fillColor(primaryColor)
       .fontSize(16)
       .text('Category Emission Breakdown', 50, 380);

    const tableY = 410;
    const colWidths = [180, 100, 100, 115];
    const headers = ['Emissions Category', 'Activities Count', 'Total Emissions', '% of Footprint'];
    
    // Draw table header
    doc.rect(50, tableY, 495, 24).fill(primaryColor);
    doc.fillColor(whiteColor).fontSize(10);
    headers.forEach((h, idx) => {
      let x = 60;
      for (let i = 0; i < idx; i++) x += colWidths[i];
      doc.text(h, x, tableY + 7);
    });

    let currentY = tableY + 24;
    const catList = [
      { name: 'Transportation', count: reportData.categories.transportation.count, emissions: reportData.categories.transportation.emissions },
      { name: 'Electricity', count: reportData.categories.electricity.count, emissions: reportData.categories.electricity.emissions },
      { name: 'Food Habits', count: reportData.categories.food.count, emissions: reportData.categories.food.emissions },
      { name: 'Waste Generation', count: reportData.categories.waste.count, emissions: reportData.categories.waste.emissions },
      { name: 'Water Consumption', count: reportData.categories.water.count, emissions: reportData.categories.water.emissions },
    ];

    catList.forEach((cat, idx) => {
      // Background shading for alternating rows
      if (idx % 2 === 1) {
        doc.rect(50, currentY, 495, 22).fill(lightBgColor);
      }
      doc.fillColor(darkColor).fontSize(10);
      
      const pct = grandTotalPct(cat.emissions, reportData.totalEmissions);
      
      doc.text(cat.name, 60, currentY + 6);
      doc.text(`${cat.count} logs`, 60 + colWidths[0], currentY + 6);
      doc.text(`${cat.emissions.toFixed(2)} kg`, 60 + colWidths[0] + colWidths[1], currentY + 6);
      doc.text(`${pct}%`, 60 + colWidths[0] + colWidths[1] + colWidths[2], currentY + 6);
      
      currentY += 22;
    });

    // Helper
    function grandTotalPct(catVal, total) {
      if (total === 0) return 0;
      return Math.round((catVal / total) * 100);
    }

    // --- PAGE 2: RECOMMENDATIONS & GOALS ---
    doc.addPage();

    doc.fillColor(primaryColor)
       .fontSize(18)
       .text('Actionable Recommendations & Savings', 50, 60);

    doc.fillColor(darkColor)
       .fontSize(10)
       .text('Based on your activity patterns over the last 30 days, we recommend prioritizing these sustainability actions:', 50, 85);

    let recY = 110;
    reportData.recommendations.forEach((rec, idx) => {
      if (idx >= 4) return; // Limit to top 4 recommendations
      
      // Recommendation card box
      doc.rect(50, recY, 495, 65).fill(lightBgColor);
      
      // Left border accent color depending on category
      doc.rect(50, recY, 5, 65).fill(primaryColor);

      doc.fillColor(primaryColor).fontSize(11).text(rec.title, 70, recY + 10);
      doc.fillColor(darkColor).fontSize(9).text(rec.description, 70, recY + 25, { width: 350 });
      
      // Savings Metric
      doc.rect(435, recY + 12, 100, 40).fill('#ecfdf5');
      doc.fillColor(primaryColor)
         .fontSize(9)
         .text('EST. SAVINGS', 440, recY + 18, { align: 'center', width: 90 })
         .fontSize(12)
         .text(`-${rec.estimatedSavings} kg`, 440, recY + 30, { align: 'center', width: 90 });

      recY += 75;
    });

    // Goals & Achievements Section
    doc.fillColor(primaryColor)
       .fontSize(18)
       .text('Goal Progress & Gamification Achievements', 50, recY + 15);

    let goalY = recY + 45;
    
    // Left column: Active Goals
    doc.fillColor(darkColor).fontSize(12).text('Active Goal Progress', 50, goalY);
    if (reportData.goals && reportData.goals.length > 0) {
      let activeGoalY = goalY + 20;
      reportData.goals.forEach((g) => {
        doc.fillColor(darkColor).fontSize(10).text(`${g.category.toUpperCase()} - Target limit: ${g.target_emission} kg CO2e`, 50, activeGoalY);
        // Draw miniature progress bar
        doc.rect(50, activeGoalY + 14, 200, 8).fill('#e5e7eb');
        doc.rect(50, activeGoalY + 14, Math.min(200, Math.round(g.progress_pct * 2)), 8).fill(primaryColor);
        doc.fontSize(8).text(`${Math.round(g.progress_pct)}% complete`, 260, activeGoalY + 14);
        activeGoalY += 35;
      });
    } else {
      doc.fillColor('#6b7280').fontSize(10).text('No active goals defined for this period.', 50, goalY + 25);
    }

    // Right column: Badges
    const badgeX = doc.page.width - 240;
    doc.fillColor(darkColor).fontSize(12).text('Recent Badges Unlocked', badgeX, goalY);
    if (reportData.badges && reportData.badges.length > 0) {
      let bY = goalY + 20;
      reportData.badges.forEach((b, idx) => {
        if (idx >= 4) return;
        doc.fillColor(primaryColor).fontSize(10).text(`🏅 ${b.title}`, badgeX, bY);
        doc.fillColor(darkColor).fontSize(9).text(b.description, badgeX + 18, bY + 13, { width: 170 });
        bY += 35;
      });
    } else {
      doc.fillColor('#6b7280').fontSize(10).text('Start logging activities to earn your first sustainability badge!', badgeX, goalY + 25);
    }

    // Add headers and footers to all pages dynamically
    const pages = doc.bufferedPageRange();
    for (let i = 0; i < pages.count; i++) {
      doc.switchToPage(i);
      drawHeader(i + 1, pages.count);
    }

    // End stream
    doc.end();
  }
}
