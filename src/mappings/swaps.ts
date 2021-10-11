import {log, BigInt, BigDecimal, Value, Bytes, Address} from '@graphprotocol/graph-ts'
import {concat} from '@graphprotocol/graph-ts/helper-functions'
import {Swap} from '../types/templates/Pair/Pair'
import {PairCreated} from '../types/Factory/Factory'
import {Pair as PairTemplate} from '../types/templates'
import {Pair, Candle} from '../types/schema'
import {fetchTokenDecimals} from "./helpers";

export function handleNewPair(event: PairCreated): void {
    let pair = new Pair(event.params.pair.toHex());
    pair.token0 = event.params.token0;
    pair.token1 = event.params.token1;
    pair.factory = '0xEF45d134b73241eDa7703fa787148D9C9F4950b0';
    pair.token0Decimals = fetchTokenDecimals(pair.token0);
    pair.token1Decimals = fetchTokenDecimals(pair.token1);
    if (pair.token0Decimals === null ||
        pair.token1Decimals === null) {
        // No decimal values are available.
        // This will crash rate calculations if not skipped.
        return;
    }
    pair.save();

    PairTemplate.create(event.params.pair)
}

export function handleSwap(event: Swap): void {
    let token0Amount: BigInt = event.params.amount0In.minus(event.params.amount0Out).abs();
    let token1Amount: BigInt = event.params.amount1Out.minus(event.params.amount1In).abs();
    if (token0Amount.isZero() || token1Amount.isZero()) {
        return;
    }
    let pair = Pair.load(event.address.toHex());
    let x = BigInt.fromI32(10).pow(u8(pair.token0Decimals));
    let y = BigInt.fromI32(10).pow(u8(pair.token1Decimals));
    if (x.isZero() || y.isZero()) {
        return;
    }
    let token0AmountDec = token0Amount.divDecimal(x.toBigDecimal());
    let token1AmountDec = token1Amount.divDecimal(y.toBigDecimal());
    let price = token0AmountDec.div(token1AmountDec);
    let tokens = concat(pair.token0, pair.token1);
    let timestamp = event.block.timestamp.toI32();

    let periods: i32[] = [1 * 60, 5 * 60, 10 * 60, 15 * 60, 30 * 60, 60 * 60, 4 * 60 * 60, 12 * 60 * 60, 24 * 60 * 60, 7 * 24 * 60 * 60];
    for (let i = 0; i < periods.length; i++) {
        let time_id = timestamp / periods[i];
        let candle_id = concat(concat(Bytes.fromI32(time_id), Bytes.fromI32(periods[i])), tokens).toHex();
        let candle = Candle.load(candle_id);
        if (candle === null) {
            candle = new Candle(candle_id);
            candle.time = timestamp;
            candle.period = periods[i];
            candle.token0 = pair.token0;
            candle.token1 = pair.token1;
            candle.open = price;
            candle.low = price;
            candle.high = price;
            candle.token0TotalAmount = BigInt.fromI32(0);
            candle.token1TotalAmount = BigInt.fromI32(0);
        } else {
            if (price < candle.low) {
                candle.low = price;
            }
            if (price > candle.high) {
                candle.high = price;
            }
        }

        candle.close = price;
        candle.lastBlock = event.block.number.toI32();
        candle.token0TotalAmount = candle.token0TotalAmount.plus(token0Amount);
        candle.token1TotalAmount = candle.token1TotalAmount.plus(token1Amount);
        candle.save();
    }
}
