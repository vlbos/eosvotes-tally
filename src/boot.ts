import { state } from "./state";
import { getAccount, getTableRows, log, error } from "./utils";
import { Votes, Voters, Vote, Proposals, Proposal } from "../types/state";
import { updateTally } from "./updaters";

/**
 * Get all unique voters
 */
async function getVoters(votes: Votes) {
    const voters: Voters = {};

    for (const vote of votes) {
        const account_name = vote.voter;

        // Get Voter Info
        if (!voters[account_name]) {
            const account = await getAccount(account_name);
            if (account) voters[account_name] = account.voter_info;
            else error({type: "boot", message: `${account_name} is missing`});
        }
    }
    return voters;
}

/**
 * Get all votes from `eosforumrcpp`
 */
async function getVotes() {
    // Params
    const limit = 500;
    let lower_bound: string = "0";

    // Data Containers
    const votes: Votes = [];

    // Iterate over `voters` table
    while (true) {
        const { rows, more } = await getTableRows<Vote>("eosforumrcpp", "eosforumrcpp", "vote", { limit, lower_bound });

        // Iterate over each vote and store results
        for (const row of rows) {
            lower_bound = String(row.id);
            votes.push(row);
        }
        // Stop loop
        if (more === false) { break; }
    }
    return votes;
}

/**
 * Get all proposals from `eosforumrcpp`
 */
async function getProposals() {
    // Params
    const limit = 99999;
    let lower_bound: string = "0";

    // Data Containers
    const proposals: Proposals = [];

    // Iterate over `voters` table
    while (true) {
        const { rows, more } = await getTableRows<Proposal>("eosforumrcpp", "eosforumrcpp", "proposal", { limit, lower_bound });

        // Iterate over each vote and store results
        for (const row of rows) {
            lower_bound = String(row.proposal_name);
            proposals.push(row);
        }
        // TO-DO
        if (more === true) error({type: "boot", message: `"TO-DO: [lower_bound] not implemented yet"`});

        // Stop loop
        if (more === false) break;
    }
    return proposals;
}

/**
 * Initial Boot
 */
export default async function boot() {
    const votes = await getVotes();
    log({type: "boot", message: `votes: ${votes.length}`});

    const voters = await getVoters(votes);
    log({type: "boot", message: `voters: ${Object.keys(voters).length}`});

    const proposals = await getProposals();
    log({type: "boot", message: `proposals: ${proposals.length}`});

    // Update State
    state.proposals = proposals;
    state.voters = voters;
    state.votes = votes;
    updateTally();
}
