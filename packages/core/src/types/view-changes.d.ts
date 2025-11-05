import type { NonEmptyArray } from './_common';
import type * as scalar from './scalar';
import type { BorderStyle, ElementShape, ThemeColor } from './styles';
import type { AutoLayoutDirection, ViewManualLayout } from './view-common';
export declare namespace ViewChange {
    interface ChangeElementStyle {
        op: 'change-element-style';
        style: {
            border?: BorderStyle;
            opacity?: number;
            shape?: ElementShape;
            color?: ThemeColor;
        };
        targets: NonEmptyArray<scalar.Fqn | scalar.DeploymentFqn>;
    }
    interface SaveManualLayout {
        op: 'save-manual-layout';
        layout: ViewManualLayout;
    }
    interface ChangeAutoLayout {
        op: 'change-autolayout';
        layout: {
            direction: AutoLayoutDirection;
            nodeSep?: number | null;
            rankSep?: number | null;
        };
    }
}
export type ViewChange = ViewChange.ChangeElementStyle | ViewChange.SaveManualLayout | ViewChange.ChangeAutoLayout;
//# sourceMappingURL=view-changes.d.ts.map