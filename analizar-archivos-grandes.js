/**
 * Script para Analizar Archivos Grandes y Proponer División
 * Versión corregida para Windows/VS Code
 */

const fs = require('fs');
const path = require('path');

class FileAnalyzer {
  constructor(projectPath = './') {
    this.projectPath = projectPath;
    this.largeFiles = [];
    this.suggestions = [];
  }

  // Analizar todos los archivos del proyecto
  analyzeProject() {
    console.log('📊 ANALIZANDO TAMAÑO DE ARCHIVOS');
    console.log('=================================\n');
    
    const srcPath = path.join(this.projectPath, 'src');
    if (fs.existsSync(srcPath)) {
      this.scanDirectory(srcPath);
      this.generateSuggestions();
      this.showResults();
    } else {
      console.log('❌ No se encontró la carpeta src/');
      console.log('   Asegúrate de ejecutar el script desde la raíz del proyecto');
    }
  }

  // Escanear directorio recursivamente
  scanDirectory(dirPath) {
    try {
      const files = fs.readdirSync(dirPath);
      
      files.forEach(file => {
        const filePath = path.join(dirPath, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
          this.scanDirectory(filePath);
        } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
          this.analyzeFile(filePath);
        }
      });
    } catch (error) {
      console.log(`⚠️  Error leyendo directorio: ${dirPath}`);
    }
  }

  // Analizar archivo individual
  analyzeFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      const lineCount = lines.length;
      
      // Considerar archivos grandes si tienen más de 300 líneas
      if (lineCount > 300) {
        const relativePath = path.relative(this.projectPath, filePath);
        
        const analysis = {
          path: relativePath,
          fullPath: filePath,
          lineCount: lineCount,
          size: this.getFileSize(filePath),
          components: this.countComponents(content),
          functions: this.countFunctions(content),
          imports: this.countImports(content),
          complexity: this.calculateComplexity(lineCount)
        };
        
        this.largeFiles.push(analysis);
      }
    } catch (error) {
      console.log(`⚠️  Error leyendo archivo: ${filePath}`);
    }
  }

  // Obtener tamaño del archivo
  getFileSize(filePath) {
    try {
      const stats = fs.statSync(filePath);
      const sizeInKB = (stats.size / 1024).toFixed(1);
      return `${sizeInKB} KB`;
    } catch (error) {
      return 'N/A';
    }
  }

  // Contar componentes React
  countComponents(content) {
    const componentMatches = content.match(/const\s+\w+\s*=\s*\(\s*\)\s*=>/g) || [];
    const functionMatches = content.match(/function\s+\w+\s*\(/g) || [];
    return componentMatches.length + functionMatches.length;
  }

  // Contar funciones
  countFunctions(content) {
    const functionMatches = content.match(/const\s+\w+\s*=\s*\(/g) || [];
    const asyncMatches = content.match(/const\s+\w+\s*=\s*async\s*\(/g) || [];
    return functionMatches.length + asyncMatches.length;
  }

  // Contar imports
  countImports(content) {
    const importMatches = content.match(/import\s+.*from/g) || [];
    return importMatches.length;
  }

  // Calcular complejidad
  calculateComplexity(lineCount) {
    if (lineCount > 1000) return 'MUY ALTA';
    if (lineCount > 700) return 'ALTA';
    if (lineCount > 500) return 'MEDIA';
    return 'BAJA';
  }

  // Generar sugerencias de división
  generateSuggestions() {
    this.largeFiles.forEach(file => {
      const suggestion = this.createDivisionSuggestion(file);
      this.suggestions.push(suggestion);
    });
  }

  // Crear sugerencia específica para cada archivo
  createDivisionSuggestion(file) {
    const fileName = path.basename(file.path, path.extname(file.path));
    
    let suggestion = {
      originalFile: file.path,
      lineCount: file.lineCount,
      complexity: file.complexity,
      priority: this.getPriority(file.lineCount),
      suggestedFiles: [],
      steps: []
    };

    // Sugerencias específicas por tipo de archivo
    if (fileName.includes('List')) {
      // Archivos tipo Lista (TrabajadoresList, NovedadesList, etc.)
      suggestion.suggestedFiles = [
        `${fileName}.js`, // Componente principal
        `${fileName}Form.js`, // Formulario
        `${fileName}Table.js`, // Tabla
        `${fileName}Filters.js`, // Filtros
        `${fileName}Utils.js`, // Utilidades
        `${fileName}Hooks.js` // Custom hooks
      ];
      
      suggestion.steps = [
        '1. Extraer formulario a componente separado',
        '2. Separar tabla en su propio archivo',
        '3. Mover filtros a componente independiente',
        '4. Crear archivo de utilidades para funciones helper',
        '5. Extraer custom hooks para lógica de estado'
      ];
      
    } else if (fileName.includes('Dashboard')) {
      // Archivos tipo Dashboard
      suggestion.suggestedFiles = [
        `${fileName}.js`, // Componente principal
        `${fileName}Cards.js`, // Tarjetas/Cards
        `${fileName}Charts.js`, // Gráficos
        `${fileName}Filters.js`, // Filtros
        `${fileName}Utils.js`, // Cálculos y utilidades
        `${fileName}Hooks.js` // Custom hooks
      ];
      
      suggestion.steps = [
        '1. Extraer tarjetas/cards a componente separado',
        '2. Separar gráficos en su propio archivo',
        '3. Mover filtros a componente independiente',
        '4. Crear archivo de utilidades para cálculos',
        '5. Extraer hooks para manejo de datos'
      ];
      
    } else {
      // Sugerencia genérica
      suggestion.suggestedFiles = [
        `${fileName}.js`, // Componente principal
        `${fileName}Components.js`, // Sub-componentes
        `${fileName}Utils.js`, // Utilidades
        `${fileName}Hooks.js` // Custom hooks
      ];
      
      suggestion.steps = [
        '1. Identificar sub-componentes y extraerlos',
        '2. Mover funciones de utilidad a archivo separado',
        '3. Extraer custom hooks para lógica de estado',
        '4. Mantener solo el componente principal en el archivo original'
      ];
    }

    return suggestion;
  }

  // Obtener prioridad de división
  getPriority(lineCount) {
    if (lineCount > 1000) return 'URGENTE';
    if (lineCount > 700) return 'ALTA';
    if (lineCount > 500) return 'MEDIA';
    return 'BAJA';
  }

  // Mostrar resultados
  showResults() {
    console.log(`📁 Archivos analizados en: ${this.projectPath}`);
    console.log(`📊 Archivos grandes encontrados: ${this.largeFiles.length}\n`);

    if (this.largeFiles.length === 0) {
      console.log('✅ ¡Excelente! No se encontraron archivos excesivamente grandes.');
      console.log('   Tus archivos tienen un tamaño manejable.\n');
      return;
    }

    // Mostrar archivos grandes ordenados por tamaño
    const sortedFiles = this.largeFiles.sort((a, b) => b.lineCount - a.lineCount);
    
    console.log('📋 ARCHIVOS GRANDES ENCONTRADOS:');
    console.log('=================================');
    
    sortedFiles.forEach((file, index) => {
      console.log(`${index + 1}. ${file.path}`);
      console.log(`   📏 Líneas: ${file.lineCount}`);
      console.log(`   💾 Tamaño: ${file.size}`);
      console.log(`   🔧 Complejidad: ${file.complexity}`);
      console.log(`   ⚡ Prioridad: ${this.getPriority(file.lineCount)}`);
      console.log('');
    });

    // Mostrar sugerencias de división
    console.log('💡 SUGERENCIAS DE DIVISIÓN:');
    console.log('===========================\n');
    
    this.suggestions.forEach((suggestion, index) => {
      console.log(`${index + 1}. ${suggestion.originalFile} (${suggestion.lineCount} líneas)`);
      console.log(`   Prioridad: ${suggestion.priority}`);
      console.log('   Archivos sugeridos:');
      
      suggestion.suggestedFiles.forEach(file => {
        console.log(`   📄 ${file}`);
      });
      
      console.log('   Pasos recomendados:');
      suggestion.steps.forEach(step => {
        console.log(`   ${step}`);
      });
      console.log('');
    });

    // Recomendaciones generales
    this.showGeneralRecommendations();
    
    // Guardar reporte
    this.saveReport();
  }

  // Mostrar recomendaciones generales
  showGeneralRecommendations() {
    console.log('🎯 RECOMENDACIONES GENERALES:');
    console.log('=============================');
    console.log('1. 🚨 Empezar por archivos con prioridad URGENTE');
    console.log('2. 📦 Dividir UN archivo a la vez');
    console.log('3. 🔄 Hacer backup antes de cada división');
    console.log('4. ✅ Probar que todo funciona después de cada cambio');
    console.log('5. 📝 Mantener imports/exports organizados');
    console.log('6. 🎯 Objetivo: Máximo 300 líneas por archivo');
    console.log('');
    
    console.log('📚 BENEFICIOS DE DIVIDIR ARCHIVOS:');
    console.log('==================================');
    console.log('✅ Código más fácil de mantener');
    console.log('✅ Mejor rendimiento en desarrollo');
    console.log('✅ Más fácil encontrar bugs');
    console.log('✅ Mejor colaboración en equipo');
    console.log('✅ Reutilización de componentes');
    console.log('✅ Testing más sencillo');
    console.log('');
  }

  // Guardar reporte
  saveReport() {
    try {
      const report = {
        timestamp: new Date().toISOString(),
        projectPath: this.projectPath,
        summary: {
          totalLargeFiles: this.largeFiles.length,
          urgentFiles: this.suggestions.filter(s => s.priority === 'URGENTE').length,
          highPriorityFiles: this.suggestions.filter(s => s.priority === 'ALTA').length
        },
        largeFiles: this.largeFiles,
        suggestions: this.suggestions
      };
      
      const reportPath = path.join(this.projectPath, 'analisis-archivos-grandes.json');
      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
      
      console.log(`📄 Reporte detallado guardado en: analisis-archivos-grandes.json`);
      console.log('   Puedes abrir este archivo para ver todos los detalles\n');
    } catch (error) {
      console.log('⚠️  No se pudo guardar el reporte, pero el análisis se completó correctamente');
    }
  }
}

// Ejecutar análisis
console.log('🔍 Iniciando análisis de archivos grandes...\n');
const analyzer = new FileAnalyzer('./');
analyzer.analyzeProject();
console.log('✅ Análisis completado');