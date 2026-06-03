import React from 'react';
import { Button, PanelToggle } from '@/components/common';
import { ProductGroupFieldset } from './ProductGroupFieldset';
import { SetupPanelScroll } from './SetupPanelScroll';
import { TransportFields } from './TransportFields';
import type { SetupPanelProps } from './setup.types';
import { useSetupPanel } from './useSetupPanel';

export function SetupPanel({
  onGenerated,
  expanded,
  onToggleExpanded,
}: SetupPanelProps): React.ReactElement {
  const {
    products,
    transportCode,
    setTransportCode,
    transportType,
    setTransportType,
    groups,
    loading,
    error,
    updateGroup,
    updateNestingLevel,
    addNestingLevel,
    removeNestingLevel,
    addProductGroup,
    removeProductGroup,
    handleSubmit,
    setupValidationError,
  } = useSetupPanel(onGenerated);

  const submitDisabled = loading || groups.length === 0 || setupValidationError !== null;

  return (
    <aside className="setup-panel">
      <PanelToggle
        expanded={expanded}
        onToggle={onToggleExpanded}
        label={expanded ? 'Hide setup panel' : 'Show setup panel'}
        edge="setup"
      />
      <span className="setup-panel__collapsed-label">Setup</span>
      <SetupPanelScroll watchKey={`${groups.length}-${products.length}`}>
        <h2>Cargo Setup</h2>
        <p className="setup-hint">
          Routes are assigned to packaging and goods (randomly on generation). MCI is calculated
          separately for each product.
        </p>
        <form onSubmit={handleSubmit}>
          <TransportFields
            transportCode={transportCode}
            transportType={transportType}
            onCodeChange={setTransportCode}
            onTypeChange={setTransportType}
          />

          {groups.map((group, gi) => (
            <ProductGroupFieldset
              key={`${group.productSku}-${gi}`}
              groupIndex={gi}
              group={group}
              products={products}
              canRemoveGroup={groups.length > 1}
              onUpdate={(patch) => updateGroup(gi, patch)}
              onRemoveGroup={() => removeProductGroup(gi)}
              onNestingChange={(li, childCount) =>
                updateNestingLevel(gi, li, { childCount })
              }
              onAddNesting={() => addNestingLevel(gi)}
              onRemoveNesting={(li) => removeNestingLevel(gi, li)}
            />
          ))}

          {groups.length < products.length && (
            <Button type="button" variant="outline" onClick={addProductGroup}>
              + product to truck
            </Button>
          )}

          <Button type="submit" variant="primary" disabled={submitDisabled}>
            {loading ? 'Generating…' : 'generate & load'}
          </Button>
        </form>
        {(error || setupValidationError) && (
          <p className="error-text">{error ?? setupValidationError}</p>
        )}
      </SetupPanelScroll>
      <footer className="setup-panel__footer">made with excitement by @hannakot62 🤝 AI</footer>
    </aside>
  );
}
