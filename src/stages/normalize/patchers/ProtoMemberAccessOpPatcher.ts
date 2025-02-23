import { SourceType } from 'coffee-lex';
import { SourceToken } from 'coffee-lex';
import NodePatcher from '../../../patchers/NodePatcher';
import { PatcherContext } from '../../../patchers/types';
import MemberAccessOpPatcher from './MemberAccessOpPatcher';

export default class ProtoMemberAccessOpPatcher extends NodePatcher {
  expression: NodePatcher;

  constructor(patcherContext: PatcherContext, expression: NodePatcher) {
    super(patcherContext);
    this.expression = expression;
  }

  patchAsExpression(): void {
    this.expression.patch();
    // `a::b` → `a.prototype.b`
    //   ^^       ^^^^^^^^^^
    const protoToken = this.getProtoToken();
    if (this.parent instanceof MemberAccessOpPatcher) {
      this.overwrite(protoToken.start, protoToken.end, '.prototype.');
    } else {
      this.overwrite(protoToken.start, protoToken.end, '.prototype');
    }
  }

  getProtoToken(): SourceToken {
    const protoIndex = this.indexOfSourceTokenBetweenSourceIndicesMatching(
      this.expression.outerEnd,
      this.contentEnd,
      (token) => token.type === SourceType.PROTO
    );

    if (protoIndex) {
      const protoToken = this.sourceTokenAtIndex(protoIndex);

      if (protoToken) {
        return protoToken;
      }
    }

    throw this.error(`unable to find '::' token after proto member access`);
  }
}
