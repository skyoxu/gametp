/**
 * Turn
 */

import { TestRepository } from './TestRepository';
import type {
  GameTurn,
  TurnId,
  GuildId,
  ITurnRepository,
  TurnPhase,
} from '../../contracts/guild-manager-chunk-001';

export class TestTurnRepository
  extends TestRepository<GameTurn, TurnId>
  implements ITurnRepository
{
  async getCurrentTurn(guildId: GuildId): Promise<GameTurn | null> {
    const allTurns = await this.findAll();
    // Find the latest turn for the given guild
    const guildTurns = allTurns
      .filter(turn => turn.guildId === guildId)
      .sort((a, b) => b.turnNumber - a.turnNumber);

    return guildTurns[0] || null;
  }

  async findByPhase(phase: TurnPhase): Promise<GameTurn[]> {
    const allTurns = await this.findAll();
    return allTurns.filter(turn => turn.currentPhase === phase);
  }

  async updatePhase(id: TurnId, newPhase: TurnPhase): Promise<void> {
    await this.update(id, { currentPhase: newPhase } as Partial<GameTurn>);
  }
}
