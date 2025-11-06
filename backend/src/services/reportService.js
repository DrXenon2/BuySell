const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const config = require('../config');
const logger = require('../utils/logger');
const supabase = require('../config/supabase');

class ReportService {
  constructor() {
    this.supabase = supabase.getClient();
  }

  /**
   * Générer un rapport
   */
  async generateReport(reportType, format = 'pdf', filters = {}) {
    try {
      const reportData = await this.getReportData(reportType, filters);
      
      switch (format.toLowerCase()) {
        case 'pdf':
          return await this.generatePdfReport(reportType, reportData, filters);
        
        case 'excel':
          return await this.generateExcelReport(reportType, reportData, filters);
        
        case 'json':
          return await this.generateJsonReport(reportType, reportData, filters);
        
        default:
          throw new Error(`Format non supporté: ${format}`);
      }

    } catch (error) {
      logger.error('Erreur service report generateReport:', error);
      throw error;
    }
  }

  /**
   * Obtenir les données du rapport
   */
  async getReportData(reportType, filters) {
    const reportGenerators = {
      sales: this.getSalesReportData,
      products: this.getProductsReportData,
      customers: this.getCustomersReportData,
      inventory: this.getInventoryReportData,
      financial: this.getFinancialReportData
    };

    const generator = reportGenerators[reportType];
    if (!generator) {
      throw new Error(`Type de rapport non supporté: ${reportType}`);
    }

    return await generator.call(this, filters);
  }

  /**
   * Données du rapport des ventes
   */
  async getSalesReportData(filters) {
    const { data, error } = await this.supabase.rpc('get_sales_report_data', {
      date_from: filters.date_from,
      date_to: filters.date_to,
      category_id: filters.category_id,
      seller_id: filters.seller_id
    });

    if (error) throw error;

    return {
      summary: data?.summary || {},
      daily_sales: data?.daily_sales || [],
      top_products: data?.top_products || [],
      sales_by_category: data?.sales_by_category || [],
      sales_by_region: data?.sales_by_region || []
    };
  }

  /**
   * Données du rapport des produits
   */
  async getProductsReportData(filters) {
    const { data, error } = await this.supabase.rpc('get_products_report_data', {
      date_from: filters.date_from,
      date_to: filters.date_to,
      category_id: filters.category_id
    });

    if (error) throw error;

    return {
      performance: data?.performance || [],
      inventory: data?.inventory || [],
      reviews: data?.reviews || [],
      categories: data?.categories || []
    };
  }

  /**
   * Données du rapport des clients
   */
  async getCustomersReportData(filters) {
    const { data, error } = await this.supabase.rpc('get_customers_report_data', {
      date_from: filters.date_from,
      date_to: filters.date_to
    });

    if (error) throw error;

    return {
      acquisition: data?.acquisition || [],
      retention: data?.retention || [],
      lifetime_value: data?.lifetime_value || [],
      segmentation: data?.segmentation || []
    };
  }

  /**
   * Données du rapport d'inventaire
   */
  async getInventoryReportData(filters) {
    const { data, error } = await this.supabase.rpc('get_inventory_report_data', {
      low_stock_threshold: filters.low_stock_threshold || 10
    });

    if (error) throw error;

    return {
      stock_levels: data?.stock_levels || [],
      low_stock_alerts: data?.low_stock_alerts || [],
      inventory_turnover: data?.inventory_turnover || [],
      valuation: data?.valuation || {}
    };
  }

  /**
   * Données du rapport financier
   */
  async getFinancialReportData(filters) {
    const { data, error } = await this.supabase.rpc('get_financial_report_data', {
      date_from: filters.date_from,
      date_to: filters.date_to
    });

    if (error) throw error;

    return {
      revenue: data?.revenue || {},
      expenses: data?.expenses || {},
      profit: data?.profit || {},
      cash_flow: data?.cash_flow || [],
      balance_sheet: data?.balance_sheet || {}
    };
  }

  /**
   * Générer un rapport PDF
   */
  async generatePdfReport(reportType, data, filters) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        const chunks = [];

        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // En-tête
        this.addPdfHeader(doc, reportType, filters);

        // Résumé
        this.addPdfSummary(doc, data.summary);

        // Contenu selon le type de rapport
        switch (reportType) {
          case 'sales':
            this.addSalesPdfContent(doc, data);
            break;
          case 'products':
            this.addProductsPdfContent(doc, data);
            break;
          case 'customers':
            this.addCustomersPdfContent(doc, data);
            break;
          case 'inventory':
            this.addInventoryPdfContent(doc, data);
            break;
          case 'financial':
            this.addFinancialPdfContent(doc, data);
            break;
        }

        // Pied de page
        this.addPdfFooter(doc);

        doc.end();

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Générer un rapport Excel
   */
  async generateExcelReport(reportType, data, filters) {
    try {
      const workbook = new ExcelJS.Workbook();
      workbook.creator = config.app.name;
      workbook.created = new Date();

      // Feuille de résumé
      const summarySheet = workbook.addWorksheet('Résumé');
      this.addExcelSummary(summarySheet, data.summary, reportType, filters);

      // Feuilles spécifiques selon le type
      switch (reportType) {
        case 'sales':
          this.addSalesExcelSheets(workbook, data);
          break;
        case 'products':
          this.addProductsExcelSheets(workbook, data);
          break;
        case 'customers':
          this.addCustomersExcelSheets(workbook, data);
          break;
        case 'inventory':
          this.addInventoryExcelSheets(workbook, data);
          break;
        case 'financial':
          this.addFinancialExcelSheets(workbook, data);
          break;
      }

      return await workbook.xlsx.writeBuffer();

    } catch (error) {
      logger.error('Erreur service report generateExcelReport:', error);
      throw error;
    }
  }

  /**
   * Générer un rapport JSON
   */
  async generateJsonReport(reportType, data, filters) {
    return {
      report_type: reportType,
      generated_at: new Date().toISOString(),
      filters: filters,
      data: data
    };
  }

  /**
   * Méthodes PDF
   */

  addPdfHeader(doc, reportType, filters) {
    const reportTitles = {
      sales: 'Rapport des Ventes',
      products: 'Rapport des Produits',
      customers: 'Rapport des Clients',
      inventory: 'Rapport d\'Inventaire',
      financial: 'Rapport Financier'
    };

    doc.fontSize(20)
       .text(config.app.name, 50, 50)
       .fontSize(16)
       .text(reportTitles[reportType] || 'Rapport', 50, 80)
       .fontSize(10)
       .text(`Généré le: ${new Date().toLocaleDateString('fr-FR')}`, 50, 105)
       .moveDown(2);
  }

  addPdfSummary(doc, summary) {
    if (!summary || Object.keys(summary).length === 0) return;

    doc.fontSize(14)
       .text('Résumé', { underline: true })
       .moveDown(0.5)
       .fontSize(10);

    Object.entries(summary).forEach(([key, value]) => {
      doc.text(`${this.formatKey(key)}: ${this.formatValue(value)}`);
    });

    doc.moveDown();
  }

  addSalesPdfContent(doc, data) {
    // Ventes quotidiennes
    if (data.daily_sales && data.daily_sales.length > 0) {
      doc.addPage()
         .fontSize(14)
         .text('Ventes Quotidiennes', { underline: true })
         .moveDown(0.5)
         .fontSize(8);

      data.daily_sales.forEach(sale => {
        doc.text(`${sale.date}: ${this.formatPrice(sale.amount)} (${sale.orders} commandes)`);
      });
    }

    // Produits les plus vendus
    if (data.top_products && data.top_products.length > 0) {
      doc.addPage()
         .fontSize(14)
         .text('Produits les Plus Vendus', { underline: true })
         .moveDown(0.5)
         .fontSize(8);

      data.top_products.forEach((product, index) => {
        doc.text(`${index + 1}. ${product.name}: ${product.quantity} vendus, ${this.formatPrice(product.revenue)}`);
      });
    }
  }

  addProductsPdfContent(doc, data) {
    // Performance des produits
    if (data.performance && data.performance.length > 0) {
      doc.addPage()
         .fontSize(14)
         .text('Performance des Produits', { underline: true })
         .moveDown(0.5)
         .fontSize(8);

      data.performance.forEach(product => {
        doc.text(`${product.name}: ${product.sales} ventes, ${this.formatPrice(product.revenue)}, Note: ${product.rating}/5`);
      });
    }
  }

  addCustomersPdfContent(doc, data) {
    // Acquisition clients
    if (data.acquisition && data.acquisition.length > 0) {
      doc.addPage()
         .fontSize(14)
         .text('Acquisition Clients', { underline: true })
         .moveDown(0.5)
         .fontSize(8);

      data.acquisition.forEach(acquisition => {
        doc.text(`${acquisition.period}: ${acquisition.new_customers} nouveaux clients`);
      });
    }
  }

  addInventoryPdfContent(doc, data) {
    // Alertes stock faible
    if (data.low_stock_alerts && data.low_stock_alerts.length > 0) {
      doc.addPage()
         .fontSize(14)
         .text('Alertes Stock Faible', { underline: true })
         .moveDown(0.5)
         .fontSize(8);

      data.low_stock_alerts.forEach(product => {
        doc.text(`${product.name}: ${product.quantity} restants (Seuil: ${product.low_stock_threshold})`);
      });
    }
  }

  addFinancialPdfContent(doc, data) {
    // Revenus
    if (data.revenue) {
      doc.addPage()
         .fontSize(14)
         .text('Revenus', { underline: true })
         .moveDown(0.5)
         .fontSize(8);

      Object.entries(data.revenue).forEach(([key, value]) => {
        doc.text(`${this.formatKey(key)}: ${this.formatPrice(value)}`);
      });
    }
  }

  addPdfFooter(doc) {
    const pageHeight = doc.page.height;
    
    doc.y = pageHeight - 100;
    doc.fontSize(8)
       .text('Rapport généré automatiquement', 50, doc.y)
       .text(`Page ${doc.bufferedPageRange().count}`, 50, doc.y + 15);
  }

  /**
   * Méthodes Excel
   */

  addExcelSummary(sheet, summary, reportType, filters) {
    // Titre
    sheet.mergeCells('A1:D1');
    sheet.getCell('A1').value = `${config.app.name} - ${this.getReportTitle(reportType)}`;
    sheet.getCell('A1').font = { size: 16, bold: true };

    // Date de génération
    sheet.getCell('A3').value = 'Généré le:';
    sheet.getCell('B3').value = new Date().toLocaleDateString('fr-FR');

    // Filtres
    let row = 4;
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        sheet.getCell(`A${row}`).value = `${this.formatKey(key)}:`;
        sheet.getCell(`B${row}`).value = value;
        row++;
      }
    });

    // Résumé
    row += 2;
    sheet.getCell(`A${row}`).value = 'Résumé';
    sheet.getCell(`A${row}`).font = { bold: true };

    Object.entries(summary).forEach(([key, value], index) => {
      sheet.getCell(`A${row + index + 1}`).value = this.formatKey(key);
      sheet.getCell(`B${row + index + 1}`).value = this.formatValue(value);
    });

    // Style
    sheet.columns = [
      { width: 25 },
      { width: 20 },
      { width: 25 },
      { width: 20 }
    ];
  }

  addSalesExcelSheets(workbook, data) {
    // Ventes quotidiennes
    if (data.daily_sales && data.daily_sales.length > 0) {
      const dailySheet = workbook.addWorksheet('Ventes Quotidiennes');
      dailySheet.addRow(['Date', 'Montant', 'Commandes', 'Panier Moyen']);

      data.daily_sales.forEach(sale => {
        dailySheet.addRow([
          sale.date,
          sale.amount,
          sale.orders,
          sale.average_order_value
        ]);
      });
    }

    // Produits populaires
    if (data.top_products && data.top_products.length > 0) {
      const productsSheet = workbook.addWorksheet('Produits Populaires');
      productsSheet.addRow(['Produit', 'Quantité', 'Revenu', 'Note']);

      data.top_products.forEach(product => {
        productsSheet.addRow([
          product.name,
          product.quantity,
          product.revenue,
          product.rating
        ]);
      });
    }
  }

  addProductsExcelSheets(workbook, data) {
    // Performance produits
    if (data.performance && data.performance.length > 0) {
      const perfSheet = workbook.addWorksheet('Performance Produits');
      perfSheet.addRow(['Produit', 'Ventes', 'Revenu', 'Stock', 'Note']);

      data.performance.forEach(product => {
        perfSheet.addRow([
          product.name,
          product.sales,
          product.revenue,
          product.stock,
          product.rating
        ]);
      });
    }
  }

  addCustomersExcelSheets(workbook, data) {
    // Acquisition clients
    if (data.acquisition && data.acquisition.length > 0) {
      const acquisitionSheet = workbook.addWorksheet('Acquisition Clients');
      acquisitionSheet.addRow(['Période', 'Nouveaux Clients', 'Clients Récurrents']);

      data.acquisition.forEach(acquisition => {
        acquisitionSheet.addRow([
          acquisition.period,
          acquisition.new_customers,
          acquisition.returning_customers
        ]);
      });
    }
  }

  addInventoryExcelSheets(workbook, data) {
    // Niveaux de stock
    if (data.stock_levels && data.stock_levels.length > 0) {
      const stockSheet = workbook.addWorksheet('Niveaux de Stock');
      stockSheet.addRow(['Produit', 'Stock Actuel', 'Stock Minimum', 'Statut']);

      data.stock_levels.forEach(product => {
        stockSheet.addRow([
          product.name,
          product.current_stock,
          product.min_stock,
          product.status
        ]);
      });
    }
  }

  addFinancialExcelSheets(workbook, data) {
    // Revenus et dépenses
    if (data.revenue && data.expenses) {
      const financialSheet = workbook.addWorksheet('Finances');
      financialSheet.addRow(['Catégorie', 'Montant']);

      Object.entries(data.revenue).forEach(([key, value]) => {
        financialSheet.addRow([`Revenu - ${this.formatKey(key)}`, value]);
      });

      Object.entries(data.expenses).forEach(([key, value]) => {
        financialSheet.addRow([`Dépense - ${this.formatKey(key)}`, value]);
      });
    }
  }

  /**
   * Utilitaires
   */

  getReportTitle(reportType) {
    const titles = {
      sales: 'Rapport des Ventes',
      products: 'Rapport des Produits',
      customers: 'Rapport des Clients',
      inventory: 'Rapport d\'Inventaire',
      financial: 'Rapport Financier'
    };

    return titles[reportType] || 'Rapport';
  }

  formatKey(key) {
    const translations = {
      'total_revenue': 'Revenu Total',
      'total_orders': 'Commandes Total',
      'average_order_value': 'Panier Moyen',
      'conversion_rate': 'Taux de Conversion',
      'new_customers': 'Nouveaux Clients',
      'returning_customers': 'Clients Récurrents'
    };

    return translations[key] || key.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }

  formatValue(value) {
    if (typeof value === 'number') {
      if (value >= 1000) {
        return this.formatPrice(value);
      }
      return value.toString();
    }
    return value;
  }

  formatPrice(amount) {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  }

  /**
   * Historique des rapports
   */
  async saveReportHistory(reportData) {
    try {
      const { data, error } = await this.supabase
        .from('report_history')
        .insert({
          report_type: reportData.report_type,
          format: reportData.format,
          filters: reportData.filters,
          generated_by: reportData.user_id,
          file_size: reportData.file_size,
          download_url: reportData.download_url,
          generated_at: new Date()
        })
        .select()
        .single();

      if (error) throw error;
      return data;

    } catch (error) {
      logger.error('Erreur sauvegarde historique rapport:', error);
      throw error;
    }
  }

  async getReportHistory(userId, limit = 50) {
    try {
      const { data, error } = await this.supabase
        .from('report_history')
        .select('*')
        .eq('generated_by', userId)
        .order('generated_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data;

    } catch (error) {
      logger.error('Erreur récupération historique rapports:', error);
      throw error;
    }
  }
}

module.exports = new ReportService();
