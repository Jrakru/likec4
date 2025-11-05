import { nonNullable } from '@likec4/core';
import { loggable } from '@likec4/log';
import { serverLogger } from '../../logger';
const logger = serverLogger.getChild('ImportsParser');
export function ImportsParser(B) {
    return class ImportsParser extends B {
        parseImports() {
            const imports = this.doc.parseResult.value.imports ?? [];
            for (const importsFromPoject of imports) {
                const project = importsFromPoject.project;
                let imported = importsFromPoject.imports;
                while (imported) {
                    try {
                        this.doc.c4Imports.set(project, this.resolveFqn(nonNullable(imported.imported.ref, `ElementRef is empty of imported: ${imported.imported.$refText}`)));
                    }
                    catch (e) {
                        logger.warn(loggable(e));
                    }
                    imported = imported.prev;
                }
            }
        }
    };
}
