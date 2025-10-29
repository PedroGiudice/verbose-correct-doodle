/**
 * Document Detector - Sistema Inteligente de Detecção e Separação de Documentos Processuais
 *
 * Detecta automaticamente diferentes peças processuais dentro de uma íntegra,
 * identificando quebras de documento e classificando cada peça.
 *
 * @version 4.0.0
 * @author verbose-correct-doodle
 */

class DocumentDetector {
    constructor() {
        // Padrões de tipos de documentos processuais
        this.documentTypes = {
            'PETIÇÃO INICIAL': {
                patterns: [
                    /EXCELENT[ÍI]SSIMO\s+SENHOR\s+DOUTOR\s+JU[ÍI]Z/i,
                    /EXMO\.?\s+SR\.?\s+DR\.?\s+JU[ÍI]Z/i,
                    /PETI[ÇC][ÃA]O\s+INICIAL/i,
                    /V[EÊ]M\s+PERANTE\s+VOSSA\s+EXCEL[EÊ]NCIA/i
                ],
                score: 10
            },
            'CONTESTAÇÃO': {
                patterns: [
                    /CONTESTA[ÇC][ÃA]O/i,
                    /V[EÊ]M\s+CONTESTAR\s+A\s+A[ÇC][ÃA]O/i,
                    /DEFESA/i
                ],
                score: 8
            },
            'RÉPLICA': {
                patterns: [
                    /R[ÉE]PLICA/i,
                    /IMPUGNA[ÇC][ÃA]O\s+[ÀA]\s+CONTESTA[ÇC][ÃA]O/i
                ],
                score: 8
            },
            'SENTENÇA': {
                patterns: [
                    /SENTEN[ÇC]A/i,
                    /VISTOS\s+ETC\.?/i,
                    /JULGO\s+PROCEDENTE/i,
                    /JULGO\s+IMPROCEDENTE/i,
                    /HOMOLOGO\s+O\s+ACORDO/i
                ],
                score: 9
            },
            'DECISÃO': {
                patterns: [
                    /DECIS[ÃA]O\s+INTERLOCUT[ÓO]RIA/i,
                    /DEFIRO/i,
                    /INDEFIRO/i,
                    /DECIS[ÃA]O/i
                ],
                score: 7
            },
            'DESPACHO': {
                patterns: [
                    /DESPACHO/i,
                    /CITE-SE/i,
                    /INTIME-SE/i,
                    /MANIFESTE-SE/i,
                    /CUMPRA-SE/i
                ],
                score: 6
            },
            'ACÓRDÃO': {
                patterns: [
                    /AC[ÓO]RD[ÃA]O/i,
                    /TRIBUNAL\s+DE\s+JUSTI[ÇC]A/i,
                    /RELATOR(?:A)?:\s*(?:DES|MIN)/i,
                    /VOTO/i
                ],
                score: 9
            },
            'CERTIDÃO': {
                patterns: [
                    /CERTID[ÃA]O/i,
                    /CERTIFICO\s+QUE/i
                ],
                score: 5
            },
            'AR': {
                patterns: [
                    /AVISO\s+DE\s+RECEBIMENTO/i,
                    /AR\s+DIGITAL/i,
                    /CITADO\s+EM/i,
                    /DATA\s+DO\s+RECEBIMENTO/i
                ],
                score: 7
            },
            'MANDADO': {
                patterns: [
                    /MANDADO\s+DE/i,
                    /OFICIAL\s+DE\s+JUSTI[ÇC]A/i,
                    /CUMPRA-SE\s+O\s+PRESENTE\s+MANDADO/i
                ],
                score: 7
            }
        };

        // Padrões que indicam QUEBRA de documento (início de novo documento)
        this.breakPatterns = {
            // Cabeçalhos formais
            formal_header: {
                regex: /^(EXCELENT[ÍI]SSIMO|EXMO\.?|ILUSTR[ÍI]SSIMO|ILMO\.?)\s+(SENHOR|SR\.?)/i,
                score: 10,
                description: 'Cabeçalho formal (indica início de petição)'
            },

            // Títulos de documentos
            document_title: {
                regex: /^(PETI[ÇC][ÃA]O|CONTESTA[ÇC][ÃA]O|SENTEN[ÇC]A|DECIS[ÃA]O|DESPACHO|AC[ÓO]RD[ÃA]O|R[ÉE]PLICA|CERTID[ÃA]O|MANDADO)/i,
                score: 9,
                description: 'Título de documento'
            },

            // Cabeçalho de tribunal
            tribunal_header: {
                regex: /^(PODER\s+JUDICI[ÁA]RIO|JUSTI[ÇC]A\s+(FEDERAL|ESTADUAL)|TRIBUNAL\s+DE\s+JUSTI[ÇC]A)/i,
                score: 8,
                description: 'Cabeçalho de tribunal'
            },

            // Assinatura seguida de nova data
            signature_new_date: {
                regex: /Assinado\s+(digitalmente|eletronicamente).*?\n.*?(\d{2}\/\d{2}\/\d{4})/is,
                score: 7,
                description: 'Assinatura digital + nova data (fim doc + início novo)'
            },

            // Número de processo
            process_number: {
                regex: /^(Processo|Autos|N[úu]mero)[\s:]+\d{7}-?\d{2}\.\d{4}\.\d{1}\.\d{2}\.\d{4}/i,
                score: 8,
                description: 'Número de processo (pode indicar novo documento)'
            },

            // Mudança de advogado/OAB
            lawyer_change: {
                regex: /OAB\/[A-Z]{2}\s+\d+/i,
                score: 5,
                description: 'Nova OAB (possível mudança de parte/documento)'
            }
        };

        // Padrões de metadados que ajudam a identificar documentos
        this.metadataPatterns = {
            date: /(\d{2}\/\d{2}\/\d{4})|(\d{2}\s+de\s+\w+\s+de\s+\d{4})/i,
            lawyer: /(?:Advogad[oa]|OAB)[\s:\/]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,
            oab: /OAB\/([A-Z]{2})\s+(\d+)/i,
            judge: /(?:Ju[ií]z[ao]?|Desembargador[a]?)[\s:]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,
            court: /(PODER\s+JUDICI[ÁA]RIO|JUSTI[ÇC]A\s+FEDERAL|TRIBUNAL)/i
        };
    }

    /**
     * Detecta e separa documentos em um texto de íntegra processual
     *
     * @param {string} fullText - Texto completo extraído do PDF
     * @returns {Array} - Array de objetos {type, text, metadata, confidence}
     */
    detectDocuments(fullText) {
        const lines = fullText.split('\n');
        const documents = [];
        let currentDocument = null;
        let currentLines = [];
        let lineBuffer = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            const nextLines = lines.slice(i + 1, i + 5).join('\n'); // Contexto das próximas linhas

            // Detectar quebra de documento
            const breakScore = this._calculateBreakScore(line, nextLines, lineBuffer);

            if (breakScore > 15 && currentLines.length > 10) {
                // Salvar documento atual
                if (currentDocument) {
                    currentDocument.text = currentLines.join('\n');
                    currentDocument.lineCount = currentLines.length;
                    documents.push(currentDocument);
                }

                // Iniciar novo documento
                const docType = this._classifyDocumentType(line, nextLines);
                currentDocument = {
                    type: docType.type,
                    confidence: docType.confidence,
                    startLine: i,
                    metadata: this._extractMetadata(line + '\n' + nextLines),
                    text: '',
                    lineCount: 0
                };
                currentLines = [line];
                lineBuffer = [];
            } else {
                // Continuar documento atual
                currentLines.push(line);
                lineBuffer.push(line);
                if (lineBuffer.length > 20) {
                    lineBuffer.shift(); // Manter apenas últimas 20 linhas no buffer
                }
            }
        }

        // Salvar último documento
        if (currentDocument && currentLines.length > 0) {
            currentDocument.text = currentLines.join('\n');
            currentDocument.lineCount = currentLines.length;
            documents.push(currentDocument);
        }

        // Se não detectou nenhum documento, retornar tudo como um único documento
        if (documents.length === 0) {
            documents.push({
                type: 'DOCUMENTO ÚNICO',
                confidence: 0.5,
                startLine: 0,
                metadata: this._extractMetadata(fullText.substring(0, 2000)),
                text: fullText,
                lineCount: lines.length
            });
        }

        return this._postProcessDocuments(documents);
    }

    /**
     * Calcula score de probabilidade de quebra de documento
     */
    _calculateBreakScore(line, nextLines, previousBuffer) {
        let score = 0;
        const context = line + '\n' + nextLines;

        // Verificar padrões de quebra
        for (const [key, pattern] of Object.entries(this.breakPatterns)) {
            if (pattern.regex.test(context)) {
                score += pattern.score;
            }
        }

        // Linha em caixa alta (possível título)
        if (line.length > 5 && line === line.toUpperCase() && /^[A-ZÀ-ÿ\s]+$/.test(line)) {
            score += 5;
        }

        // Linha curta após muitas linhas longas (possível título)
        if (line.length < 50 && previousBuffer.length > 5) {
            const avgLength = previousBuffer.reduce((sum, l) => sum + l.length, 0) / previousBuffer.length;
            if (avgLength > 100) {
                score += 3;
            }
        }

        // Mudança brusca de estilo
        if (this._detectStyleChange(previousBuffer, [line, ...nextLines.split('\n').slice(0, 3)])) {
            score += 4;
        }

        return score;
    }

    /**
     * Detecta mudança de estilo de escrita
     */
    _detectStyleChange(before, after) {
        if (before.length < 5 || after.length < 3) return false;

        const beforeAvgLength = before.reduce((sum, l) => sum + l.length, 0) / before.length;
        const afterAvgLength = after.reduce((sum, l) => sum + l.length, 0) / after.length;

        // Mudança significativa no tamanho médio de linha
        if (Math.abs(beforeAvgLength - afterAvgLength) > 50) {
            return true;
        }

        return false;
    }

    /**
     * Classifica o tipo de documento baseado no conteúdo
     */
    _classifyDocumentType(firstLine, context) {
        const fullContext = firstLine + '\n' + context;
        let bestMatch = { type: 'DOCUMENTO', confidence: 0.3 };

        for (const [type, config] of Object.entries(this.documentTypes)) {
            let score = 0;
            for (const pattern of config.patterns) {
                if (pattern.test(fullContext)) {
                    score += config.score;
                }
            }

            if (score > bestMatch.confidence * 10) {
                bestMatch = {
                    type: type,
                    confidence: Math.min(score / 10, 1.0)
                };
            }
        }

        return bestMatch;
    }

    /**
     * Extrai metadados do documento
     */
    _extractMetadata(text) {
        const metadata = {};

        // Data
        const dateMatch = text.match(this.metadataPatterns.date);
        if (dateMatch) {
            metadata.date = dateMatch[0];
        }

        // Advogado
        const lawyerMatch = text.match(this.metadataPatterns.lawyer);
        if (lawyerMatch) {
            metadata.lawyer = lawyerMatch[1];
        }

        // OAB
        const oabMatch = text.match(this.metadataPatterns.oab);
        if (oabMatch) {
            metadata.oab = `${oabMatch[1]} ${oabMatch[2]}`;
        }

        // Juiz
        const judgeMatch = text.match(this.metadataPatterns.judge);
        if (judgeMatch) {
            metadata.judge = judgeMatch[1];
        }

        // Tribunal
        const courtMatch = text.match(this.metadataPatterns.court);
        if (courtMatch) {
            metadata.court = courtMatch[1];
        }

        return metadata;
    }

    /**
     * Pós-processa documentos para melhorar detecção
     */
    _postProcessDocuments(documents) {
        // Filtrar documentos muito pequenos (provavelmente falsos positivos)
        documents = documents.filter(doc => doc.lineCount > 5 || doc.confidence > 0.8);

        // Reclassificar documentos com baixa confiança baseado em contexto
        for (let i = 0; i < documents.length; i++) {
            if (documents[i].confidence < 0.6) {
                const reclassified = this._reclassifyByContext(documents[i], documents[i-1], documents[i+1]);
                documents[i] = { ...documents[i], ...reclassified };
            }
        }

        // Numerar documentos
        documents.forEach((doc, idx) => {
            doc.documentNumber = idx + 1;
        });

        return documents;
    }

    /**
     * Reclassifica documento baseado no contexto (docs anteriores/posteriores)
     */
    _reclassifyByContext(current, previous, next) {
        // Se anterior é petição e atual não foi classificado, pode ser anexo ou despacho
        if (previous && previous.type === 'PETIÇÃO INICIAL' && current.type === 'DOCUMENTO') {
            if (current.text.toLowerCase().includes('despacho') ||
                current.text.toLowerCase().includes('cite-se')) {
                return { type: 'DESPACHO', confidence: 0.7 };
            }
        }

        // Se anterior é despacho de citação e atual é desconhecido, pode ser AR
        if (previous && previous.type === 'DESPACHO' && current.text.toLowerCase().includes('recebimento')) {
            return { type: 'AR', confidence: 0.8 };
        }

        return {};
    }

    /**
     * Formata documentos para output estruturado em Markdown
     */
    formatToMarkdown(documents) {
        let markdown = `# ÍNTEGRA PROCESSUAL\n\n`;
        markdown += `**Total de documentos detectados:** ${documents.length}\n\n`;
        markdown += `---\n\n`;

        documents.forEach((doc, idx) => {
            markdown += `## DOCUMENTO ${doc.documentNumber}: ${doc.type}\n\n`;

            // Metadados
            if (Object.keys(doc.metadata).length > 0) {
                markdown += `**Metadados:**\n`;
                if (doc.metadata.date) markdown += `- Data: ${doc.metadata.date}\n`;
                if (doc.metadata.lawyer) markdown += `- Advogado: ${doc.metadata.lawyer}\n`;
                if (doc.metadata.oab) markdown += `- OAB: ${doc.metadata.oab}\n`;
                if (doc.metadata.judge) markdown += `- Juiz: ${doc.metadata.judge}\n`;
                if (doc.metadata.court) markdown += `- Tribunal: ${doc.metadata.court}\n`;
                markdown += `- Confiança: ${(doc.confidence * 100).toFixed(1)}%\n`;
                markdown += `\n`;
            }

            // Texto do documento
            markdown += `**Conteúdo:**\n\n`;
            markdown += doc.text;
            markdown += `\n\n`;

            if (idx < documents.length - 1) {
                markdown += `---\n\n`;
            }
        });

        return markdown;
    }

    /**
     * Exporta documentos como JSON estruturado
     */
    formatToJSON(documents) {
        return JSON.stringify({
            totalDocuments: documents.length,
            detectionDate: new Date().toISOString(),
            documents: documents.map(doc => ({
                number: doc.documentNumber,
                type: doc.type,
                confidence: doc.confidence,
                metadata: doc.metadata,
                statistics: {
                    lineCount: doc.lineCount,
                    charCount: doc.text.length,
                    wordCount: doc.text.split(/\s+/).length
                },
                content: doc.text
            }))
        }, null, 2);
    }
}

// Export para uso em módulos ES6
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DocumentDetector;
}
