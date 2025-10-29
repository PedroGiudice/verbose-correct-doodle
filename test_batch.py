#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Teste em Lote - Sistema Inteligente v4.0
Processa múltiplos PDFs e gera relatório comparativo
"""

import sys
from pathlib import Path
from test_intelligent_extractor import IntelligentExtractorTest
import json
import time

def test_batch(pdf_paths):
    """Testa múltiplos PDFs e gera relatório"""
    extractor = IntelligentExtractorTest()
    results_summary = []

    print("="*80)
    print("TESTE EM LOTE - SISTEMA INTELIGENTE V4.0")
    print("="*80)
    print(f"\nTotal de PDFs para processar: {len(pdf_paths)}\n")

    for idx, pdf_path in enumerate(pdf_paths, 1):
        pdf_path = Path(pdf_path)

        if not pdf_path.exists():
            print(f"\n[{idx}/{len(pdf_paths)}] ERRO: PDF não encontrado: {pdf_path}")
            continue

        print(f"\n{'='*80}")
        print(f"[{idx}/{len(pdf_paths)}] Processando: {pdf_path.name}")
        print(f"{'='*80}")

        start_time = time.time()

        try:
            # Processar PDF
            results = extractor.process_pdf(pdf_path)

            # Salvar em pasta específica
            output_dir = Path('test_results') / pdf_path.stem
            extractor.save_results(results, output_dir)

            elapsed = time.time() - start_time

            # Resumo
            summary = {
                'arquivo': pdf_path.name,
                'status': 'OK',
                'paginas': results['metadata']['total_pages'],
                'documentos': results['metadata']['total_documents'],
                'linhas_removidas': results['metadata']['total_lines_removed'],
                'tempo_processamento': f"{elapsed:.2f}s",
                'output_dir': str(output_dir)
            }

            results_summary.append(summary)

            print(f"\n[OK] Processado com sucesso em {elapsed:.2f}s")
            print(f"     Documentos: {summary['documentos']}")
            print(f"     Linhas removidas: {summary['linhas_removidas']}")

        except Exception as e:
            elapsed = time.time() - start_time
            print(f"\n[ERRO] Falha no processamento: {str(e)}")

            summary = {
                'arquivo': pdf_path.name,
                'status': 'ERRO',
                'erro': str(e),
                'tempo_processamento': f"{elapsed:.2f}s"
            }
            results_summary.append(summary)

    # Gerar relatório final
    print("\n" + "="*80)
    print("RELATÓRIO FINAL")
    print("="*80)

    total_ok = sum(1 for r in results_summary if r['status'] == 'OK')
    total_erro = sum(1 for r in results_summary if r['status'] == 'ERRO')

    print(f"\nTotal processados: {len(pdf_paths)}")
    print(f"Sucessos: {total_ok}")
    print(f"Erros: {total_erro}")

    if total_ok > 0:
        total_docs = sum(r.get('documentos', 0) for r in results_summary if r['status'] == 'OK')
        total_linhas = sum(r.get('linhas_removidas', 0) for r in results_summary if r['status'] == 'OK')

        print(f"\nEstatísticas:")
        print(f"  Total de documentos detectados: {total_docs}")
        print(f"  Total de linhas removidas: {total_linhas}")
        print(f"  Média de documentos/PDF: {total_docs/total_ok:.1f}")

    print("\nDetalhes por arquivo:")
    print("-" * 80)

    for r in results_summary:
        print(f"\n{r['arquivo']}")
        print(f"  Status: {r['status']}")
        if r['status'] == 'OK':
            print(f"  Páginas: {r['paginas']}")
            print(f"  Documentos: {r['documentos']}")
            print(f"  Linhas removidas: {r['linhas_removidas']}")
            print(f"  Tempo: {r['tempo_processamento']}")
            print(f"  Output: {r['output_dir']}")
        else:
            print(f"  Erro: {r.get('erro', 'Desconhecido')}")

    # Salvar relatório JSON
    report_path = Path('test_results') / 'relatorio_batch.json'
    with open(report_path, 'w', encoding='utf-8') as f:
        json.dump({
            'total_pdfs': len(pdf_paths),
            'sucessos': total_ok,
            'erros': total_erro,
            'resultados': results_summary
        }, f, ensure_ascii=False, indent=2)

    print(f"\n[OK] Relatório salvo em: {report_path}")
    print("\n" + "="*80)


if __name__ == '__main__':
    # PDFs para testar
    pdfs = [
        r"E:\CLAUDE\SALESFORCE\Experato Agente Autônomo de Investimentos Ltda\Docs. Claude\1007129-59.2025.8.26.0100.pdf",
        r"E:\CLAUDE\SALESFORCE\Theiki Dynami S.A\Docs. Claude\1010841-60.2025.8.26.0002.pdf",
        r"E:\CLAUDE\SALESFORCE\Importadora de Frutas La Violetera\Cópias Integrais - Importadora de Frutas Lavioletera x Salesforce - 13.08.2025.pdf",
        r"E:\CLAUDE\SALESFORCE\VS Tecnologia e Automação\VS Tecnologia x Salesforce - Cópia Integral - 20.03.2025.pdf"
    ]

    # Ou passar PDFs por linha de comando
    if len(sys.argv) > 1:
        pdfs = sys.argv[1:]

    test_batch(pdfs)
