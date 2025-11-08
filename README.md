# Pré-Processador Jurídico v4.0 Enhanced

**Sistema de Extração Avançada de Documentos Processuais Eletrônicos Brasileiros**

[![Version](https://img.shields.io/badge/version-4.0.0-blue.svg)](https://github.com/PedroGiudice/verbose-correct-doodle)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Status](https://img.shields.io/badge/status-production-success.svg)]()

---

## 🎯 Visão Geral

Sistema **100% offline** e **client-side** para extração, limpeza e conversão de PDFs jurídicos brasileiros, com suporte a:

- ✅ **OCR Automático** para PDFs escaneados (Tesseract.js)
- ✅ **Análise Estrutural** de objetos PDF (assinaturas, annotations)
- ✅ **Métricas de Qualidade** com confidence scoring
- ✅ **Detecção Inteligente** de ordem de leitura (múltiplas colunas, texto rotacionado)
- ✅ **7 Sistemas Processuais** (AUTO, EPROC, ESAJ, PJE, PROJUDI, STF, STJ)
- ✅ **Exportação Multi-formato** (TXT, MD, DOCX, HTML)

---

## 🚀 Quick Start

### Uso Básico

1. **Abra o arquivo:** `preprocessador-juridico-v4.html`
2. **Selecione um PDF**
3. **Configure:** Sistema AUTO, Modo MODERADO
4. **Processe:** Clique em "PROCESSAR"
5. **Exporte:** TXT, MD, DOCX ou HTML

---

## 📊 Novidades da v4.0

| Recurso | v3.0 | v4.0 Enhanced |
|---------|------|---------------|
| **PDFs Escaneados** | ❌ Não suportado | ✅ OCR automático |
| **Quality Score** | ❌ Não disponível | ✅ 0-100% |
| **Análise Estrutural** | ❌ Não implementado | ✅ Parsing PDF |
| **Ordem de Leitura** | Básica | ✅ Avançada |
| **Progress Tracking** | ❌ Não disponível | ✅ Barra detalhada |

---

## 🏗️ Arquitetura

```
modules/
├── pdf-structural-parser.js    ← Análise de objetos PDF
├── quality-metrics.js          ← Confidence scoring
├── reading-order.js            ← Detecção de ordem
├── ocr-engine.js               ← OCR (Tesseract)
└── main-enhanced.js            ← Integração
```

---

## 📚 Documentação Completa

- **[CHANGELOG_v4.0.md](CHANGELOG_v4.0.md)** - Detalhes técnicos completos
- **[README.v3.md](README.v3.md)** - Documentação da versão anterior

---

## ⚡ Performance

| Método | Tempo (10 páginas) | Qualidade |
|--------|-------------------|-----------|
| Estrutural | ~5s | 95-98% |
| OCR | ~75s | 80-92% |

---

## 🔬 Fundamentos

Baseado em:
- ISO 32000-2:2020 (PDF Specification)
- ETSI TS 102 778 (PAdES)
- Lei 11.419/2006 (Processo Eletrônico)
- Projeto Victor (STF)

---

## 📄 Licença

MIT License - Uso comercial permitido

---

**Versão:** 4.0.0 | **Última Atualização:** 08/11/2025
