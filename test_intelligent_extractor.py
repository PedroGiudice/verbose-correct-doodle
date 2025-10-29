#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Test do Sistema Inteligente de Extração v4.0
Processa PDF de íntegra processual com detecção de documentos e limpeza inteligente
"""

import sys
import json
from pathlib import Path

try:
    import pypdf
except ImportError:
    print("ERRO: pypdf não instalado. Execute: pip install pypdf")
    sys.exit(1)


class IntelligentExtractorTest:
    """Teste do extrator inteligente"""

    def __init__(self):
        self.patterns = self._load_patterns()

    def _load_patterns(self):
        """Carrega padrões de assinatura"""
        patterns_file = Path(__file__).parent / 'patterns' / 'signatures_expanded.json'

        if patterns_file.exists():
            with open(patterns_file, 'r', encoding='utf-8') as f:
                return json.load(f)

        return {}

    def extract_text_from_pdf(self, pdf_path):
        """Extrai texto de PDF"""
        print(f"[1/4] Extraindo texto do PDF: {pdf_path}")

        reader = pypdf.PdfReader(pdf_path)
        num_pages = len(reader.pages)

        print(f"       Total de páginas: {num_pages}")

        full_text = []
        for i, page in enumerate(reader.pages):
            text = page.extract_text()
            full_text.append(text)

            if (i + 1) % 10 == 0:
                print(f"       Processadas: {i+1}/{num_pages} páginas")

        return '\n\n'.join(full_text), num_pages

    def detect_documents(self, text):
        """Detecta quebras de documento (implementação simplificada)"""
        print("[2/4] Detectando documentos na íntegra...")

        lines = text.split('\n')
        documents = []
        current_doc = []
        doc_count = 0

        # Padrões de quebra (implementação simplificada do document_detector.js)
        break_patterns = [
            'EXCELENTÍSSIMO',
            'EXMO',
            'PETIÇÃO',
            'CONTESTAÇÃO',
            'SENTENÇA',
            'DECISÃO',
            'DESPACHO',
            'PODER JUDICIÁRIO'
        ]

        for i, line in enumerate(lines):
            line_upper = line.strip().upper()

            # Detectar quebra
            is_break = any(pattern in line_upper for pattern in break_patterns)

            if is_break and len(current_doc) > 20:  # Mínimo 20 linhas
                # Salvar documento atual
                doc_text = '\n'.join(current_doc)
                doc_type = self._classify_document(doc_text[:500])

                documents.append({
                    'number': doc_count + 1,
                    'type': doc_type,
                    'lines': len(current_doc),
                    'chars': len(doc_text),
                    'text': doc_text
                })

                doc_count += 1
                current_doc = [line]
            else:
                current_doc.append(line)

        # Salvar último documento
        if current_doc:
            doc_text = '\n'.join(current_doc)
            doc_type = self._classify_document(doc_text[:500])

            documents.append({
                'number': doc_count + 1,
                'type': doc_type,
                'lines': len(current_doc),
                'chars': len(doc_text),
                'text': doc_text
            })

        print(f"       Documentos detectados: {len(documents)}")
        for doc in documents:
            print(f"       - Doc {doc['number']}: {doc['type']} ({doc['lines']} linhas)")

        return documents

    def _classify_document(self, beginning):
        """Classifica tipo de documento"""
        beginning_upper = beginning.upper()

        if 'PETIÇÃO' in beginning_upper or 'EXCELENTÍSSIMO' in beginning_upper:
            return 'PETIÇÃO INICIAL'
        elif 'CONTESTAÇÃO' in beginning_upper:
            return 'CONTESTAÇÃO'
        elif 'SENTENÇA' in beginning_upper:
            return 'SENTENÇA'
        elif 'DECISÃO' in beginning_upper:
            return 'DECISÃO'
        elif 'DESPACHO' in beginning_upper or 'CITE-SE' in beginning_upper:
            return 'DESPACHO'
        elif 'ACÓRDÃO' in beginning_upper:
            return 'ACÓRDÃO'
        else:
            return 'DOCUMENTO'

    def clean_text_intelligent(self, text):
        """Limpeza inteligente (implementação simplificada)"""
        print("[3/4] Limpeza inteligente do texto...")

        lines = text.split('\n')
        cleaned_lines = []
        removed_count = 0

        # Padrões de ruído (do signatures_expanded.json)
        noise_patterns = [
            'ASSINADO DIGITALMENTE',
            'ASSINADO ELETRONICAMENTE',
            'SHA-',
            'MD5:',
            'CERTIFICADO DIGITAL',
            'ICP-BRASIL',
            'AC-',
            'CÓDIGO VERIFICADOR',
            'PROTOCOLO',
            'PÁG.',
            'PÁGINA',
            'PODER JUDICIÁRIO DO ESTADO'
        ]

        for line in lines:
            line_trimmed = line.strip()
            line_upper = line_trimmed.upper()

            # Preservar linhas vazias
            if not line_trimmed:
                cleaned_lines.append(line)
                continue

            # Verificar se é ruído
            is_noise = False

            # Padrões de ruído
            for pattern in noise_patterns:
                if pattern in line_upper:
                    is_noise = True
                    removed_count += 1
                    break

            # Hash hexadecimal
            if len(line_trimmed) > 30 and all(c in '0123456789abcdefABCDEF' for c in line_trimmed.replace(' ', '')):
                is_noise = True
                removed_count += 1

            # Linha muito curta em caixa alta (possível cabeçalho repetitivo)
            if len(line_trimmed) < 20 and line_trimmed == line_trimmed.upper():
                # Mas preservar se for marcador de parágrafo
                if not any(c.isdigit() for c in line_trimmed):
                    is_noise = True
                    removed_count += 1

            if not is_noise:
                cleaned_lines.append(line)

        cleaned_text = '\n'.join(cleaned_lines)

        print(f"       Linhas originais: {len(lines)}")
        print(f"       Linhas removidas: {removed_count}")
        print(f"       Taxa de remoção: {(removed_count/len(lines)*100):.1f}%")

        return cleaned_text, removed_count

    def process_pdf(self, pdf_path):
        """Processa PDF completo"""
        print("="*60)
        print("TESTE DO EXTRATOR INTELIGENTE V4.0")
        print("="*60)
        print()

        # 1. Extrair texto
        full_text, num_pages = self.extract_text_from_pdf(pdf_path)

        # 2. Detectar documentos
        documents = self.detect_documents(full_text)

        # 3. Limpar cada documento
        cleaned_documents = []
        total_removed = 0

        for doc in documents:
            cleaned_text, removed = self.clean_text_intelligent(doc['text'])
            total_removed += removed

            cleaned_documents.append({
                **doc,
                'cleaned_text': cleaned_text,
                'removed_lines': removed
            })

        print()
        print("[4/4] Gerando outputs...")

        # 4. Gerar output
        return {
            'metadata': {
                'source_file': str(pdf_path),
                'total_pages': num_pages,
                'total_documents': len(documents),
                'total_lines_removed': total_removed
            },
            'documents': cleaned_documents
        }

    def save_results(self, results, output_dir):
        """Salva resultados"""
        output_dir = Path(output_dir)
        output_dir.mkdir(exist_ok=True)

        # 1. JSON completo
        json_path = output_dir / 'resultado_completo.json'
        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump(results, f, ensure_ascii=False, indent=2)
        print(f"       [OK] JSON salvo: {json_path}")

        # 2. Markdown estruturado
        md_path = output_dir / 'integra_processada.md'
        with open(md_path, 'w', encoding='utf-8') as f:
            f.write(f"# INTEGRA PROCESSUAL PROCESSADA\n\n")
            f.write(f"**Arquivo:** {results['metadata']['source_file']}\n")
            f.write(f"**Total de paginas:** {results['metadata']['total_pages']}\n")
            f.write(f"**Documentos detectados:** {results['metadata']['total_documents']}\n")
            f.write(f"**Linhas removidas:** {results['metadata']['total_lines_removed']}\n\n")
            f.write("---\n\n")

            for doc in results['documents']:
                f.write(f"## DOCUMENTO {doc['number']}: {doc['type']}\n\n")
                f.write(f"**Estatisticas:**\n")
                f.write(f"- Linhas originais: {doc['lines']}\n")
                f.write(f"- Linhas removidas: {doc['removed_lines']}\n")
                f.write(f"- Caracteres: {len(doc['cleaned_text'])}\n\n")
                f.write("**Conteudo Limpo:**\n\n")
                f.write(doc['cleaned_text'])
                f.write("\n\n---\n\n")

        print(f"       [OK] Markdown salvo: {md_path}")

        # 3. TXT simples
        txt_path = output_dir / 'integra_limpa.txt'
        with open(txt_path, 'w', encoding='utf-8') as f:
            for doc in results['documents']:
                f.write(f"{'='*60}\n")
                f.write(f"DOCUMENTO {doc['number']}: {doc['type']}\n")
                f.write(f"{'='*60}\n\n")
                f.write(doc['cleaned_text'])
                f.write("\n\n")

        print(f"       [OK] TXT salvo: {txt_path}")

        print()
        print("="*60)
        print("PROCESSAMENTO CONCLUÍDO!")
        print("="*60)


def main():
    if len(sys.argv) < 2:
        print("Uso: python test_intelligent_extractor.py <caminho_pdf>")
        print("Exemplo: python test_intelligent_extractor.py processo.pdf")
        sys.exit(1)

    pdf_path = Path(sys.argv[1])

    if not pdf_path.exists():
        print(f"ERRO: PDF não encontrado: {pdf_path}")
        sys.exit(1)

    # Output directory
    output_dir = Path('test_results')

    # Processar
    extractor = IntelligentExtractorTest()
    results = extractor.process_pdf(pdf_path)
    extractor.save_results(results, output_dir)


if __name__ == '__main__':
    main()
